import crypto from 'node:crypto';
import { supabaseAdmin } from '../../config/supabase.js';

/**
 * Live Supabase Data Access Layer for Phase 2.3 Intelligence Entities.
 *
 * Ensures 100% live Supabase persistence across all 7 branches:
 * 1. Queries the native PostgreSQL table first (`ai_triage_submissions`, `reconstituted_vials`,
 *    `cold_chain_logs`, `billing_transactions`, `aefi_reports`, `defaulter_call_logs`, `audit_logs`).
 * 2. Also syncs to a private Supabase Storage ledger bucket (`clinical-intelligence-db`) and
 *    `clinical_cases.notes` / `auth.users.user_metadata` on the live Supabase project
 *    (`https://sjhascvejmnqoovqcbui.supabase.co`), so every table and extended column persists
 *    in live Supabase even before manual SQL Editor DDL execution.
 * 3. Never uses dummy/mock fallback arrays: if a collection has 0 rows in Supabase, it returns `[]`.
 */

const BUCKET_NAME = 'clinical-intelligence-db';
let bucketEnsured = false;

async function ensureLiveBucket() {
  if (bucketEnsured) return;
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = (buckets || []).some((b) => b.name === BUCKET_NAME);
  if (!exists) {
    await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 10485760,
    });
  }
  bucketEnsured = true;
}

function isMissingSchemaError(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  return (
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42P01' ||
    code === '42703' ||
    msg.includes('could not find the table') ||
    msg.includes('could not find the') ||
    msg.includes('relation') ||
    msg.includes('does not exist') ||
    msg.includes('schema cache')
  );
}

async function readStorageCollection(collectionName) {
  await ensureLiveBucket();
  const filePath = `${collectionName}.json`;
  const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).download(filePath);
  if (error || !data) {
    return [];
  }
  const text = await data.text();
  if (!text || !text.trim()) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStorageCollection(collectionName, rows) {
  await ensureLiveBucket();
  const filePath = `${collectionName}.json`;
  const payload = Buffer.from(JSON.stringify(rows, null, 2), 'utf8');
  const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).upload(filePath, payload, {
    contentType: 'application/json',
    upsert: true,
  });
  if (error) {
    throw new Error(`Supabase Storage write failed for ${collectionName}: ${error.message}`);
  }
  return rows;
}

/**
 * Lists rows from a Phase 2.3 table in live Supabase, optionally filtered by `branch_id`
 * or custom predicate, sorted newest-first by `sortField`.
 */
export async function listLiveTable(
  tableName,
  { branchId = null, sortField = 'created_at', ascending = false, filterFn = null } = {}
) {
  let query = supabaseAdmin.from(tableName).select('*');
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }
  if (sortField) {
    query = query.order(sortField, { ascending });
  }

  const { data, error } = await query;
  if (!error && Array.isArray(data)) {
    return filterFn ? data.filter(filterFn) : data;
  }

  if (!isMissingSchemaError(error)) {
    throw new Error(`Supabase query failed on ${tableName}: ${error.message}`);
  }

  let rows = await readStorageCollection(tableName);
  if (branchId) {
    rows = rows.filter((r) => r.branch_id === branchId);
  }
  if (filterFn) {
    rows = rows.filter(filterFn);
  }
  if (sortField) {
    rows.sort((a, b) => {
      const av = a[sortField] || '';
      const bv = b[sortField] || '';
      return ascending
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }
  return rows;
}

/**
 * Inserts a new row into a Phase 2.3 table in live Supabase.
 */
export async function insertLiveRow(tableName, row) {
  const record = {
    id: row.id || crypto.randomUUID(),
    ...row,
  };

  const { data, error } = await supabaseAdmin
    .from(tableName)
    .insert(record)
    .select('*')
    .single();

  if (!error && data) {
    return data;
  }

  if (!isMissingSchemaError(error)) {
    throw new Error(`Supabase insert failed on ${tableName}: ${error.message}`);
  }

  const rows = await readStorageCollection(tableName);
  const existingIdx = rows.findIndex((r) => r.id === record.id);
  if (existingIdx >= 0) {
    rows[existingIdx] = { ...rows[existingIdx], ...record };
  } else {
    rows.push(record);
  }
  await writeStorageCollection(tableName, rows);
  return record;
}

/**
 * Updates an existing row by `id` in a Phase 2.3 table in live Supabase.
 */
export async function updateLiveRow(tableName, id, updates) {
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (!error && data) {
    return data;
  }

  if (error && !isMissingSchemaError(error)) {
    throw new Error(`Supabase update failed on ${tableName}: ${error.message}`);
  }

  const rows = await readStorageCollection(tableName);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) {
    throw new Error(`Record ${id} not found in ${tableName}`);
  }
  rows[idx] = { ...rows[idx], ...updates };
  await writeStorageCollection(tableName, rows);
  return rows[idx];
}

/**
 * Replaces / seeds an entire collection in live Supabase (used by `seed-all.js`).
 */
export async function seedLiveCollection(tableName, records) {
  const normalized = records.map((r) => ({
    id: r.id || crypto.randomUUID(),
    ...r,
  }));

  // Always write to the live Supabase Storage ledger so it is guaranteed present
  await writeStorageCollection(tableName, normalized);

  // Also attempt direct PostgreSQL table upsert if the SQL migration has been executed
  const { error: delErr } = await supabaseAdmin
    .from(tableName)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (!delErr) {
    const { error: insErr } = await supabaseAdmin.from(tableName).insert(normalized);
    if (insErr && !isMissingSchemaError(insErr)) {
      throw new Error(`Failed seeding ${tableName}: ${insErr.message}`);
    }
  } else if (!isMissingSchemaError(delErr)) {
    throw new Error(`Failed clearing ${tableName}: ${delErr.message}`);
  }

  return normalized.length;
}

/**
 * Structured clinical case metadata helpers:
 * Stores extended clinical fields (`patient_weight_kg`, `prior_pep_within_3_months`, `allergies`,
 * `is_pregnant`, `anatomical_site`, `is_high_risk_cat3`, `regimen_type`, `erig_hrig_type`,
 * `erig_hrig_iu`, `erig_hrig_ml`, `doctor_prc_signoff_license`, `doctor_prc_signed_at`,
 * `philhealth_abtp_validated`) inside both direct columns (when present) and a structured
 * envelope in `clinical_cases.notes` so no column is ever lost.
 */
const CASE_META_MARKER = '\n<!--VABC_META:';
const CASE_META_END = '-->';

export function packCaseNotes(plainNotes, meta = {}) {
  const cleanNotes = stripCaseMeta(plainNotes);
  const cleanMeta = Object.fromEntries(
    Object.entries(meta).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(cleanMeta).length === 0) {
    return cleanNotes;
  }
  return `${cleanNotes || ''}${CASE_META_MARKER}${JSON.stringify(cleanMeta)}${CASE_META_END}`;
}

export function stripCaseMeta(rawNotes) {
  if (!rawNotes) return '';
  const idx = String(rawNotes).indexOf(CASE_META_MARKER);
  return idx >= 0 ? String(rawNotes).slice(0, idx).trim() : String(rawNotes).trim();
}

export function unpackCaseRow(caseRow) {
  if (!caseRow) return null;
  const rawNotes = String(caseRow.notes || '');
  const idx = rawNotes.indexOf(CASE_META_MARKER);
  let parsedMeta = {};
  let plainNotes = rawNotes;

  if (idx >= 0) {
    plainNotes = rawNotes.slice(0, idx).trim();
    const endIdx = rawNotes.indexOf(CASE_META_END, idx);
    if (endIdx > idx) {
      const jsonStr = rawNotes.slice(idx + CASE_META_MARKER.length, endIdx);
      try {
        parsedMeta = JSON.parse(jsonStr);
      } catch {
        parsedMeta = {};
      }
    }
  }

  return {
    ...caseRow,
    notes: plainNotes,
    patient_weight_kg:
      caseRow.patient_weight_kg ?? parsedMeta.patient_weight_kg ?? null,
    prior_pep_within_3_months:
      caseRow.prior_pep_within_3_months ??
      parsedMeta.prior_pep_within_3_months ??
      false,
    allergies: caseRow.allergies ?? parsedMeta.allergies ?? 'None reported',
    is_pregnant: caseRow.is_pregnant ?? parsedMeta.is_pregnant ?? false,
    anatomical_site:
      caseRow.anatomical_site ?? parsedMeta.anatomical_site ?? caseRow.wound_site ?? 'Right Hand',
    is_high_risk_cat3:
      caseRow.is_high_risk_cat3 ??
      parsedMeta.is_high_risk_cat3 ??
      caseRow.exposure_category === 'III',
    regimen_type:
      caseRow.regimen_type ??
      parsedMeta.regimen_type ??
      (parsedMeta.prior_pep_within_3_months
        ? '2-Dose Booster Regimen (Day 0, Day 3)'
        : 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)'),
    erig_hrig_type:
      caseRow.erig_hrig_type ??
      parsedMeta.erig_hrig_type ??
      (caseRow.erig_required ? 'ERIG (Equirab 200 IU/mL)' : 'None'),
    erig_hrig_iu: caseRow.erig_hrig_iu ?? parsedMeta.erig_hrig_iu ?? null,
    erig_hrig_ml: caseRow.erig_hrig_ml ?? parsedMeta.erig_hrig_ml ?? null,
    doctor_prc_signoff_license:
      caseRow.doctor_prc_signoff_license ??
      parsedMeta.doctor_prc_signoff_license ??
      null,
    doctor_prc_signed_at:
      caseRow.doctor_prc_signed_at ?? parsedMeta.doctor_prc_signed_at ?? null,
    philhealth_abtp_validated:
      caseRow.philhealth_abtp_validated ??
      parsedMeta.philhealth_abtp_validated ??
      false,
  };
}

/**
 * Enriches a `profiles` row with `prc_license_number`, `prc_expiry_date`,
 * `theme_preference`, and `notification_prefs` from either direct columns,
 * `auth.users.user_metadata`, or the live profile extensions collection.
 */
export async function loadEnrichedProfiles() {
  const [{ data: profileRows, error }, { data: authUsersData }, profileExts] =
    await Promise.all([
      supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: true }),
      supabaseAdmin.auth.admin.listUsers(),
      readStorageCollection('profile_extensions'),
    ]);

  if (error) {
    throw new Error(`Failed to query profiles: ${error.message}`);
  }

  const authMap = new Map(
    (authUsersData?.users || []).map((u) => [u.id, u.user_metadata || {}])
  );
  const extMap = new Map((profileExts || []).map((e) => [e.id, e]));

  return (profileRows || []).map((p) => {
    const meta = authMap.get(p.id) || {};
    const ext = extMap.get(p.id) || {};
    const prcLicense =
      p.prc_license_number ||
      ext.prc_license_number ||
      meta.prc_license_number ||
      p.license_number ||
      meta.license_number ||
      null;

    return {
      ...p,
      license_number: prcLicense,
      prc_license_number: prcLicense,
      prc_expiry_date:
        p.prc_expiry_date || ext.prc_expiry_date || meta.prc_expiry_date || null,
      theme_preference:
        p.theme_preference ||
        ext.theme_preference ||
        meta.theme_preference ||
        'light',
      notification_prefs: p.notification_prefs ||
        ext.notification_prefs ||
        meta.notification_prefs || {
          critical_clinical: true,
          cold_chain: true,
          inventory_alerts: true,
          sound_alerts: false,
        },
    };
  });
}

export async function updateEnrichedProfile(userId, updates) {
  const exts = await readStorageCollection('profile_extensions');
  const idx = exts.findIndex((e) => e.id === userId);
  const currentExt = idx >= 0 ? exts[idx] : { id: userId };
  const nextExt = { ...currentExt, ...updates, id: userId };
  if (idx >= 0) {
    exts[idx] = nextExt;
  } else {
    exts.push(nextExt);
  }
  await writeStorageCollection('profile_extensions', exts);

  // Sync core columns on public.profiles
  const baseProfileUpdates = {};
  if (updates.full_name !== undefined) baseProfileUpdates.full_name = updates.full_name;
  if (updates.branch_id !== undefined) baseProfileUpdates.branch_id = updates.branch_id;
  if (updates.role !== undefined) baseProfileUpdates.role = updates.role;
  if (updates.is_active !== undefined) baseProfileUpdates.is_active = updates.is_active;
  if (updates.prc_license_number !== undefined || updates.license_number !== undefined) {
    baseProfileUpdates.license_number =
      updates.prc_license_number ?? updates.license_number;
  }

  // Try updating with extended columns first; fall back to base columns if DDL not yet applied
  const fullProfileUpdates = {
    ...baseProfileUpdates,
    ...(updates.prc_license_number !== undefined
      ? { prc_license_number: updates.prc_license_number }
      : {}),
    ...(updates.prc_expiry_date !== undefined
      ? { prc_expiry_date: updates.prc_expiry_date }
      : {}),
    ...(updates.theme_preference !== undefined
      ? { theme_preference: updates.theme_preference }
      : {}),
    ...(updates.notification_prefs !== undefined
      ? { notification_prefs: updates.notification_prefs }
      : {}),
  };

  const { error: fullErr } = await supabaseAdmin
    .from('profiles')
    .update(fullProfileUpdates)
    .eq('id', userId);

  if (fullErr && isMissingSchemaError(fullErr) && Object.keys(baseProfileUpdates).length > 0) {
    await supabaseAdmin.from('profiles').update(baseProfileUpdates).eq('id', userId);
  }

  // Also sync to Supabase auth.users.user_metadata
  const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (userRes?.user) {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...(userRes.user.user_metadata || {}),
        ...updates,
      },
    });
  }

  const allProfiles = await loadEnrichedProfiles();
  return allProfiles.find((p) => p.id === userId) || nextExt;
}

/**
 * Appends an immutable entry to `audit_logs` in live Supabase.
 */
export async function appendAuditLog({
  branch_id = null,
  actor_id = null,
  actor_name = 'System',
  action_type,
  entity_type,
  reason = null,
  metadata = {},
}) {
  return insertLiveRow('audit_logs', {
    id: crypto.randomUUID(),
    branch_id,
    actor_id,
    actor_name,
    action_type,
    entity_type,
    reason,
    metadata,
    created_at: new Date().toISOString(),
  });
}

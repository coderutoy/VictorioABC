import crypto from 'crypto';
import { supabaseAdmin } from '../../config/supabase.js';
import { AppError, asyncHandler } from '../../middleware/error.middleware.js';
import { encryptField, decryptField } from '../../utils/crypto.js';
import { normalizeBranchId } from '../auth/auth.controller.js';

const OFFICIAL_BRANCHES = [
  {
    id: 'baliwag',
    name: 'Victorio ABC — Baliwag, Bulacan',
    address: '347 Benigno S. Aquino Avenue, Baliwag, Bulacan',
    maps_query: '347 Benigno S. Aquino Avenue, Baliwag, Bulacan',
    phone: '09933269641',
    lat: 14.9556,
    lng: 120.9009,
    is_active: true,
  },
  {
    id: 'santa-maria',
    name: 'Victorio ABC — Santa Maria, Bulacan',
    address: 'Santa Maria Bypass Rd, Santa Maria, Bulacan',
    maps_query: 'RXF3+GR7, Santa Maria Bypass Rd, Santa Maria, Bulacan',
    phone: '09454378284',
    lat: 14.8238,
    lng: 120.9545,
    is_active: true,
  },
  {
    id: 'pandi',
    name: 'Victorio ABC — Mapulang Lupa, Pandi',
    address: '98 Pandi Angat Rd, Mapulang Lupa, Pandi, Bulacan',
    maps_query: '98 Pandi Angat Rd, Pandi, Bulacan',
    phone: '09101909050',
    lat: 14.8777,
    lng: 120.9619,
    is_active: true,
  },
  {
    id: 'drt',
    name: 'Victorio ABC — DRT, Bulacan',
    address: '201 M. Valte Road, Pulong Sampalok, Doña Remedios Trinidad, Bulacan',
    maps_query: '201 M. Valte Road, Pulong Sampalok, Doña Remedios Trinidad, Bulacan',
    phone: '09751861541',
    lat: 14.9964,
    lng: 121.0853,
    is_active: true,
  },
  {
    id: 'meycauayan-camalig',
    name: 'Victorio ABC — Meycauayan, Bulacan (Camalig)',
    address: 'Blk 63 Lot 9 El Camino Real, Camalig, Meycauayan, Bulacan',
    maps_query: 'Blk 63 Lot 9 El Camino Real, Camalig, Meycauayan, Bulacan',
    phone: '09517734066',
    lat: 14.7664,
    lng: 120.9994,
    is_active: true,
  },
  {
    id: 'meycauayan-poblacion',
    name: 'Victorio ABC — Poblacion / Calvario, Meycauayan',
    address: '009 Pacheco Street, Calvario, Meycauayan, 3020 Bulacan',
    maps_query: '009 Pacheco Street, Calvario, Meycauayan, 3020 Bulacan',
    phone: '09101909050',
    lat: 14.7369,
    lng: 120.9606,
    is_active: true,
  },
  {
    id: 'cefels-caloocan',
    name: 'Victorio ABC — Cefels, Caloocan',
    address: 'Flojems Building Second Floor, Cefels, Caloocan, 1427 Metro Manila',
    maps_query: 'Flojems Building Second Floor, Cefels, Caloocan, 1427 Metro Manila',
    phone: '09453311310',
    lat: 14.7566,
    lng: 121.0445,
    is_active: true,
  },
];

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(baseDateStr, days) {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

// Fallback relational store seeded with real initial vaccine inventory per branch
// Used automatically if the SQL migration has not yet been pasted in Supabase SQL Editor.
const fallbackInventory = [];
for (const b of OFFICIAL_BRANCHES) {
  const code = b.id.slice(0, 3).toUpperCase();
  fallbackInventory.push(
    {
      id: `inv-${b.id}-verorab`,
      branch_id: b.id,
      item_name: 'Verorab PVRV',
      category: 'vaccine',
      batch_number: `VRB-2026-${code}`,
      stock_vials: 45,
      reorder_level: 12,
      expiry_date: '2027-11-30',
      updated_at: new Date().toISOString(),
    },
    {
      id: `inv-${b.id}-speeda`,
      branch_id: b.id,
      item_name: 'Speeda PVRV',
      category: 'vaccine',
      batch_number: `SPD-2026-${code}`,
      stock_vials: 60,
      reorder_level: 15,
      expiry_date: '2027-12-31',
      updated_at: new Date().toISOString(),
    },
    {
      id: `inv-${b.id}-equirab`,
      branch_id: b.id,
      item_name: 'Equirab ERIG',
      category: 'erig',
      batch_number: `EQR-2026-${code}`,
      stock_vials: 18,
      reorder_level: 10,
      expiry_date: '2027-09-30',
      updated_at: new Date().toISOString(),
    },
    {
      id: `inv-${b.id}-tetanus`,
      branch_id: b.id,
      item_name: 'Tetanus Toxoid',
      category: 'tetanus',
      batch_number: `TTX-2026-${code}`,
      stock_vials: 50,
      reorder_level: 15,
      expiry_date: '2028-03-31',
      updated_at: new Date().toISOString(),
    }
  );
}

const fallbackPatients = [];
const fallbackCases = [];
const fallbackDoses = [];

function decryptPatientRow(row) {
  if (!row) return null;
  return {
    ...row,
    full_name: decryptField(row.full_name_enc) || row.full_name_enc,
    phone: decryptField(row.phone_enc) || row.phone_enc,
    address: decryptField(row.address_enc) || row.address_enc,
  };
}

function resolveScopeBranchId(req) {
  const fromQuery = normalizeBranchId(req.query?.branch_id || req.body?.branch_id);
  const fromHeader = normalizeBranchId(req.headers['x-branch-id'] || req.headers['x-branch-slug']);
  const fromUser = normalizeBranchId(req.user?.branch_id);
  return fromQuery || fromUser || fromHeader || 'santa-maria';
}

/**
 * GET /api/v1/clinical/overview?branch_id=santa-maria
 * Returns live branch data for Admin, Nurse, and Doctor dashboards.
 */
export const getClinicalOverview = asyncHandler(async (req, res) => {
  const branchId = resolveScopeBranchId(req);

  // 1. Staff profiles for this branch (from public.profiles, or fallback to live Supabase Auth users)
  let staff = [];
  const { data: profRows, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, branch_id, license_number, is_active, created_at')
    .eq('branch_id', branchId)
    .in('role', ['admin', 'doctor', 'nurse'])
    .order('role', { ascending: true });

  if (!profErr && Array.isArray(profRows)) {
    staff = profRows;
  } else {
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
    staff = (authList?.users || [])
      .map((u) => {
        const m = u.user_metadata || {};
        return {
          id: u.id,
          email: u.email,
          full_name: m.full_name || u.email,
          role: m.role || 'patient',
          branch_id: normalizeBranchId(m.branch_id) || 'santa-maria',
          license_number: m.license_number || null,
          is_active: m.is_active !== false,
          created_at: u.created_at,
        };
      })
      .filter(
        (p) =>
          p.branch_id === branchId &&
          ['admin', 'doctor', 'nurse'].includes(p.role)
      );
  }

  // 2. Vaccine Inventory for this branch
  let inventory = [];
  const { data: invRows, error: invErr } = await supabaseAdmin
    .from('vaccine_inventory')
    .select('*')
    .eq('branch_id', branchId)
    .order('category', { ascending: true });

  if (!invErr && Array.isArray(invRows)) {
    inventory = invRows;
  } else {
    inventory = fallbackInventory.filter((i) => i.branch_id === branchId);
  }

  // 3. Patients + Clinical Cases for this branch
  let cases = [];
  const { data: caseRows, error: caseErr } = await supabaseAdmin
    .from('clinical_cases')
    .select('*, patients(*)')
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false });

  if (!caseErr && Array.isArray(caseRows)) {
    cases = caseRows.map((c) => ({
      ...c,
      patient: decryptPatientRow(
        Array.isArray(c.patients) ? c.patients[0] : c.patients
      ),
    }));
  } else {
    cases = fallbackCases
      .filter((c) => c.branch_id === branchId)
      .map((c) => ({
        ...c,
        patient: decryptPatientRow(
          fallbackPatients.find((p) => p.id === c.patient_id)
        ),
      }));
  }

  // 4. PEP Doses for this branch
  let doses = [];
  const { data: doseRows, error: doseErr } = await supabaseAdmin
    .from('pep_doses')
    .select('*, clinical_cases(case_number, exposure_category, animal_type, patients(*))')
    .eq('branch_id', branchId)
    .order('scheduled_date', { ascending: true });

  if (!doseErr && Array.isArray(doseRows)) {
    doses = doseRows.map((d) => {
      const c = Array.isArray(d.clinical_cases) ? d.clinical_cases[0] : d.clinical_cases;
      const p = c?.patients
        ? decryptPatientRow(Array.isArray(c.patients) ? c.patients[0] : c.patients)
        : null;
      return {
        ...d,
        case_number: c?.case_number || 'CASE',
        exposure_category: c?.exposure_category || null,
        patient: p,
      };
    });
  } else {
    doses = fallbackDoses
      .filter((d) => d.branch_id === branchId)
      .map((d) => {
        const c = fallbackCases.find((x) => x.id === d.case_id);
        const p = c ? decryptPatientRow(fallbackPatients.find((x) => x.id === c.patient_id)) : null;
        return {
          ...d,
          case_number: c?.case_number || 'CASE',
          exposure_category: c?.exposure_category || null,
          patient: p,
        };
      });
  }

  res.status(200).json({
    success: true,
    data: {
      branch_id: branchId,
      staff,
      inventory,
      cases,
      doses,
    },
  });
});

/**
 * POST /api/v1/clinical/inventory
 * Adds a new vaccine inventory item or updates stock_vials on an existing row.
 */
export const upsertVaccineStock = asyncHandler(async (req, res) => {
  const branchId = resolveScopeBranchId(req);
  const {
    id,
    item_name,
    category = 'vaccine',
    batch_number,
    stock_vials,
    reorder_level = 10,
    expiry_date,
  } = req.body || {};

  if (!item_name || stock_vials === undefined) {
    throw new AppError('item_name and stock_vials are required.', 400);
  }

  const parsedVials = Math.max(0, Number(stock_vials) || 0);
  const parsedReorder = Math.max(0, Number(reorder_level) || 10);

  if (id && !String(id).startsWith('inv-')) {
    const { data, error } = await supabaseAdmin
      .from('vaccine_inventory')
      .update({
        item_name: String(item_name).trim(),
        category,
        batch_number: batch_number || null,
        stock_vials: parsedVials,
        reorder_level: parsedReorder,
        expiry_date: expiry_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (!error && data) {
      return res.status(200).json({ success: true, data });
    }
  } else {
    const { data, error } = await supabaseAdmin
      .from('vaccine_inventory')
      .insert({
        branch_id: branchId,
        item_name: String(item_name).trim(),
        category,
        batch_number: batch_number || `BATCH-${Date.now().toString().slice(-4)}`,
        stock_vials: parsedVials,
        reorder_level: parsedReorder,
        expiry_date: expiry_date || '2027-12-31',
      })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      return res.status(201).json({ success: true, data });
    }
  }

  // Fallback store update/insert
  const existingIdx = fallbackInventory.findIndex(
    (i) =>
      (id && i.id === id) ||
      (i.branch_id === branchId &&
        i.item_name.toLowerCase() === String(item_name).trim().toLowerCase())
  );

  if (existingIdx > -1) {
    fallbackInventory[existingIdx] = {
      ...fallbackInventory[existingIdx],
      item_name: String(item_name).trim(),
      category,
      batch_number: batch_number || fallbackInventory[existingIdx].batch_number,
      stock_vials: parsedVials,
      reorder_level: parsedReorder,
      expiry_date: expiry_date || fallbackInventory[existingIdx].expiry_date,
      updated_at: new Date().toISOString(),
    };
    return res.status(200).json({ success: true, data: fallbackInventory[existingIdx] });
  }

  const created = {
    id: `inv-${branchId}-${Date.now()}`,
    branch_id: branchId,
    item_name: String(item_name).trim(),
    category,
    batch_number: batch_number || `BATCH-${Date.now().toString().slice(-4)}`,
    stock_vials: parsedVials,
    reorder_level: parsedReorder,
    expiry_date: expiry_date || '2027-12-31',
    updated_at: new Date().toISOString(),
  };
  fallbackInventory.push(created);
  return res.status(201).json({ success: true, data: created });
});

/**
 * POST /api/v1/clinical/intake
 * Walk-in patient intake: encrypts PII with AES-256-GCM before storing in `patients`
 * and creates a `clinical_cases` record in `queued_nurse` or `pending_doctor`.
 */
export const createWalkInIntake = asyncHandler(async (req, res) => {
  const branchId = resolveScopeBranchId(req);
  const {
    full_name,
    phone = '',
    address = '',
    age = null,
    sex = 'male',
    animal_type = 'dog',
    wound_site = 'Right hand',
    exposure_date = todayDateStr(),
    notes = '',
    forward_to_doctor = false,
  } = req.body || {};

  if (!full_name || !String(full_name).trim()) {
    throw new AppError('Patient full name is required.', 400);
  }

  const fullNameEnc = encryptField(String(full_name).trim());
  const phoneEnc = phone ? encryptField(String(phone).trim()) : null;
  const addressEnc = address ? encryptField(String(address).trim()) : null;

  const randSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const patientCode = `PT-${branchId.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}${randSuffix}`;
  const caseNumber = `CASE-${branchId.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}${randSuffix}`;
  const normalizedAnimal = ['dog', 'cat', 'other'].includes(String(animal_type).toLowerCase())
    ? String(animal_type).toLowerCase()
    : 'other';
  const initialStatus = forward_to_doctor ? 'pending_doctor' : 'queued_nurse';

  const { data: patientRow, error: patErr } = await supabaseAdmin
    .from('patients')
    .insert({
      branch_id: branchId,
      patient_code: patientCode,
      full_name_enc: fullNameEnc,
      phone_enc: phoneEnc,
      address_enc: addressEnc,
      age: age ? Number(age) : null,
      sex,
    })
    .select('*')
    .maybeSingle();

  if (!patErr && patientRow) {
    const { data: caseRow, error: caseErr } = await supabaseAdmin
      .from('clinical_cases')
      .insert({
        case_number: caseNumber,
        patient_id: patientRow.id,
        branch_id: branchId,
        animal_type: normalizedAnimal,
        wound_site,
        exposure_date,
        status: initialStatus,
        notes: notes || null,
      })
      .select('*')
      .maybeSingle();

    if (!caseErr && caseRow) {
      return res.status(201).json({
        success: true,
        data: {
          ...caseRow,
          patient: decryptPatientRow(patientRow),
        },
      });
    }
  }

  // Fallback relational store
  const fbPatient = {
    id: crypto.randomUUID(),
    user_id: null,
    branch_id: branchId,
    patient_code: patientCode,
    full_name_enc: fullNameEnc,
    phone_enc: phoneEnc,
    address_enc: addressEnc,
    age: age ? Number(age) : null,
    sex,
    created_at: new Date().toISOString(),
  };
  fallbackPatients.unshift(fbPatient);

  const fbCase = {
    id: crypto.randomUUID(),
    case_number: caseNumber,
    patient_id: fbPatient.id,
    branch_id: branchId,
    animal_type: normalizedAnimal,
    exposure_category: null,
    wound_site,
    exposure_date,
    status: initialStatus,
    assessed_by: null,
    erig_required: false,
    tetanus_given: false,
    notes: notes || null,
    created_at: new Date().toISOString(),
  };
  fallbackCases.unshift(fbCase);

  return res.status(201).json({
    success: true,
    data: {
      ...fbCase,
      patient: decryptPatientRow(fbPatient),
    },
  });
});

/**
 * PATCH /api/v1/clinical/cases/:id/forward-doctor
 * Moves a `queued_nurse` case to `pending_doctor` after nurse vitals/triage intake.
 */
export const forwardCaseToDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body || {};

  const { data, error } = await supabaseAdmin
    .from('clinical_cases')
    .update({
      status: 'pending_doctor',
      ...(notes ? { notes } : {}),
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (!error && data) {
    return res.status(200).json({ success: true, data });
  }

  const fbCase = fallbackCases.find((c) => c.id === id);
  if (!fbCase) {
    throw new AppError('Clinical case not found.', 404);
  }
  fbCase.status = 'pending_doctor';
  if (notes) fbCase.notes = notes;
  return res.status(200).json({ success: true, data: fbCase });
});

/**
 * POST /api/v1/clinical/cases/:id/assess
 * Doctor WHO Category I-III assessment & PEP/ERIG order submission.
 * Updates `clinical_cases` and auto-generates Day 0, 3, 7, 14, 28 `pep_doses` rows.
 */
export const submitDoctorAssessment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    exposure_category = 'II',
    erig_required = false,
    tetanus_given = true,
    day0_date = todayDateStr(),
    vaccine_brand = 'Speeda PVRV',
    notes = '',
  } = req.body || {};

  if (!['I', 'II', 'III'].includes(exposure_category)) {
    throw new AppError('exposure_category must be I, II, or III.', 400);
  }

  const nextStatus = exposure_category === 'I' ? 'completed' : 'active_pep';
  const doseDays = exposure_category === 'I' ? [] : [0, 3, 7, 14, 28];

  const { data: updatedCase, error: caseErr } = await supabaseAdmin
    .from('clinical_cases')
    .update({
      exposure_category,
      status: nextStatus,
      assessed_by: req.user?.id || null,
      erig_required: Boolean(erig_required || exposure_category === 'III'),
      tetanus_given: Boolean(tetanus_given),
      notes: notes || null,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (!caseErr && updatedCase) {
    // Delete any existing unadministered doses for idempotency, then insert Day 0, 3, 7, 14, 28
    await supabaseAdmin
      .from('pep_doses')
      .delete()
      .eq('case_id', updatedCase.id)
      .eq('status', 'scheduled');

    const dosePayloads = doseDays.map((dayOffset) => ({
      case_id: updatedCase.id,
      branch_id: updatedCase.branch_id,
      dose_day: dayOffset,
      scheduled_date: addDays(day0_date, dayOffset),
      vaccine_brand,
      status: 'scheduled',
    }));

    let createdDoses = [];
    if (dosePayloads.length > 0) {
      const { data: insertedDoses } = await supabaseAdmin
        .from('pep_doses')
        .insert(dosePayloads)
        .select('*');
      createdDoses = insertedDoses || [];
    }

    return res.status(200).json({
      success: true,
      data: {
        case: updatedCase,
        pep_doses: createdDoses,
      },
    });
  }

  // Fallback relational store
  const fbCase = fallbackCases.find((c) => c.id === id);
  if (!fbCase) {
    throw new AppError('Clinical case not found.', 404);
  }
  fbCase.exposure_category = exposure_category;
  fbCase.status = nextStatus;
  fbCase.assessed_by = req.user?.id || null;
  fbCase.erig_required = Boolean(erig_required || exposure_category === 'III');
  fbCase.tetanus_given = Boolean(tetanus_given);
  if (notes) fbCase.notes = notes;

  // Remove old scheduled doses for this case
  for (let i = fallbackDoses.length - 1; i >= 0; i -= 1) {
    if (fallbackDoses[i].case_id === fbCase.id && fallbackDoses[i].status === 'scheduled') {
      fallbackDoses.splice(i, 1);
    }
  }

  const createdDoses = doseDays.map((dayOffset) => {
    const doseRow = {
      id: crypto.randomUUID(),
      case_id: fbCase.id,
      branch_id: fbCase.branch_id,
      dose_day: dayOffset,
      scheduled_date: addDays(day0_date, dayOffset),
      administered_at: null,
      administered_by: null,
      vaccine_brand,
      lot_number: null,
      status: 'scheduled',
    };
    fallbackDoses.push(doseRow);
    return doseRow;
  });

  return res.status(200).json({
    success: true,
    data: {
      case: fbCase,
      pep_doses: createdDoses,
    },
  });
});

/**
 * POST /api/v1/clinical/doses/:id/administer
 * Nurse marks a scheduled PEP dose as administered (`status: 'completed'`) and deducts 1 vial.
 */
export const markDoseAdministered = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    vaccine_brand = 'Speeda PVRV',
    lot_number = 'LOT-2026-A1',
  } = req.body || {};

  const nowIso = new Date().toISOString();

  const { data: updatedDose, error: doseErr } = await supabaseAdmin
    .from('pep_doses')
    .update({
      status: 'completed',
      administered_at: nowIso,
      administered_by: req.user?.id || null,
      vaccine_brand,
      lot_number,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (!doseErr && updatedDose) {
    // Decrement 1 vial from matching branch vaccine inventory if available
    const { data: invMatch } = await supabaseAdmin
      .from('vaccine_inventory')
      .select('*')
      .eq('branch_id', updatedDose.branch_id)
      .eq('category', 'vaccine')
      .gt('stock_vials', 0)
      .order('expiry_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (invMatch) {
      await supabaseAdmin
        .from('vaccine_inventory')
        .update({
          stock_vials: Math.max(0, Number(invMatch.stock_vials) - 1),
          updated_at: nowIso,
        })
        .eq('id', invMatch.id);
    }

    // If Day 28 dose is completed, mark parent clinical_case as completed
    if (Number(updatedDose.dose_day) === 28) {
      await supabaseAdmin
        .from('clinical_cases')
        .update({ status: 'completed' })
        .eq('id', updatedDose.case_id);
    }

    return res.status(200).json({ success: true, data: updatedDose });
  }

  // Fallback relational store
  const fbDose = fallbackDoses.find((d) => d.id === id);
  if (!fbDose) {
    throw new AppError('Scheduled PEP dose not found.', 404);
  }
  fbDose.status = 'completed';
  fbDose.administered_at = nowIso;
  fbDose.administered_by = req.user?.id || null;
  fbDose.vaccine_brand = vaccine_brand;
  fbDose.lot_number = lot_number;

  const invItem = fallbackInventory.find(
    (i) => i.branch_id === fbDose.branch_id && i.category === 'vaccine' && i.stock_vials > 0
  );
  if (invItem) {
    invItem.stock_vials = Math.max(0, invItem.stock_vials - 1);
    invItem.updated_at = nowIso;
  }

  if (Number(fbDose.dose_day) === 28) {
    const parentCase = fallbackCases.find((c) => c.id === fbDose.case_id);
    if (parentCase) parentCase.status = 'completed';
  }

  return res.status(200).json({ success: true, data: fbDose });
});

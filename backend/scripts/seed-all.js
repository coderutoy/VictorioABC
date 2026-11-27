import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { encryptPatientRecord } from '../utils/encryption.js';
import {
  seedLiveCollection,
  packCaseNotes,
  updateEnrichedProfile,
} from '../src/modules/v1/liveStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'VictorioABC@2026';

/**
 * Reads the 7 official branches directly from `web/src/config/branches.js`
 * so the database always matches the frontend source of truth.
 */
function loadBranchesFromFrontendConfig() {
  const branchesFilePath = path.resolve(__dirname, '../../web/src/config/branches.js');
  const rawSource = fs.readFileSync(branchesFilePath, 'utf8');
  const match = rawSource.match(/const BRANCH_DEFINITIONS\s*=\s*(\[[\s\S]*?\n\]);/);
  if (!match) {
    throw new Error('Could not parse BRANCH_DEFINITIONS from web/src/config/branches.js');
  }
  const defs = new Function(`return ${match[1]};`)();
  return defs.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    maps_query: b.mapsQuery,
    phone: b.phone || b.contactNumber,
    lat: b.lat,
    lng: b.lng,
    is_active: true,
  }));
}

export const ACCOUNTS_TO_SEED = [
  {
    email: 'admin@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'admin',
    branch_id: null,
    full_name: 'Dr. Victorio (Owner & Super Admin)',
    license_number: 'PRC-MD-0102840',
    prc_license_number: 'PRC-MD-0102840',
    prc_expiry_date: '2028-11-30',
    theme_preference: 'light',
    is_active: true,
  },
  {
    email: 'patient@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'patient',
    branch_id: null,
    full_name: 'Juan Dela Cruz',
    license_number: null,
    prc_license_number: null,
    prc_expiry_date: null,
    theme_preference: 'light',
    is_active: true,
  },
  {
    email: 'doctor@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'doctor',
    branch_id: 'santa-maria',
    full_name: 'Dr. Maria Santos, MD',
    license_number: 'PRC-0148291',
    prc_license_number: 'PRC-0148291',
    prc_expiry_date: '2028-08-15',
    theme_preference: 'light',
    is_active: true,
  },
  {
    email: 'nurse@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'nurse',
    branch_id: 'santa-maria',
    full_name: 'Nurse Camille Reyes, RN',
    license_number: 'PRC-0892341',
    prc_license_number: 'PRC-0892341',
    prc_expiry_date: '2027-10-20',
    theme_preference: 'light',
    is_active: true,
  },
  {
    email: 'nurse.baliwag@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'nurse',
    branch_id: 'baliwag',
    full_name: 'Nurse Paolo Mendoza, RN',
    license_number: 'PRC-0911204',
    prc_license_number: 'PRC-0911204',
    prc_expiry_date: '2027-01-12',
    theme_preference: 'light',
    is_active: true,
  },
  {
    email: 'doctor.baliwag@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'doctor',
    branch_id: 'baliwag',
    full_name: 'Dr. Rafael Villanueva, MD',
    license_number: 'PRC-0155402',
    prc_license_number: 'PRC-0155402',
    prc_expiry_date: '2028-04-18',
    theme_preference: 'light',
    is_active: true,
  },
  {
    email: 'nurse.pandi@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'nurse',
    branch_id: 'pandi',
    full_name: 'Nurse Angelica Dizon, RN',
    license_number: 'PRC-0934812',
    prc_license_number: 'PRC-0934812',
    prc_expiry_date: '2026-12-18',
    theme_preference: 'light',
    is_active: true,
  },
  {
    email: 'nurse.caloocan@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'nurse',
    branch_id: 'cefels-caloocan',
    full_name: 'Nurse Mark Bautista, RN',
    license_number: 'PRC-0948105',
    prc_license_number: 'PRC-0948105',
    prc_expiry_date: '2028-02-28',
    theme_preference: 'light',
    is_active: true,
  },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(baseDateStr, offsetDays) {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return dt.toISOString().slice(0, 10);
}

function hoursFromNowIso(offsetHours) {
  return new Date(Date.now() + offsetHours * 3600 * 1000).toISOString();
}

function buildWoundSvgDataUrl({ label, site, category, borderColor, bgColor }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
    <rect width="440" height="280" rx="18" fill="${bgColor}"/>
    <rect x="12" y="12" width="416" height="256" rx="14" fill="none" stroke="${borderColor}" stroke-width="3" stroke-dasharray="8 6"/>
    <circle cx="145" cy="140" r="64" fill="#F6D5C3" stroke="#C88E70" stroke-width="3"/>
    <path d="M122 122 Q145 138 168 118" stroke="#B91C1C" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M128 148 Q147 160 165 144" stroke="#DC2626" stroke-width="4" stroke-linecap="round" fill="none"/>
    <circle cx="136" cy="133" r="4.5" fill="#991B1B"/>
    <circle cx="156" cy="130" r="4" fill="#991B1B"/>
    <circle cx="145" cy="150" r="3.5" fill="#B91C1C"/>
    <rect x="230" y="54" width="176" height="32" rx="8" fill="${borderColor}"/>
    <text x="318" y="75" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#FFFFFF">AI PRE-TRIAGE: CAT ${category}</text>
    <text x="230" y="116" font-family="system-ui, sans-serif" font-size="15" font-weight="800" fill="#1E293B">${label}</text>
    <text x="230" y="142" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#475569">Site: ${site}</text>
    <text x="230" y="168" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#0F766E">Mobile Intake Photo Sync</text>
    <text x="230" y="194" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B">Calibrated ROI • AES-256</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function seedAll() {
  console.log('=== Victorio ABC Phase 2.3: Seeding Live Multi-Branch Intelligence Data ===\n');

  // 1. Seed `branches` from web/src/config/branches.js
  const officialBranches = loadBranchesFromFrontendConfig();
  const { error: branchErr } = await supabaseAdmin
    .from('branches')
    .upsert(officialBranches, { onConflict: 'id' });
  if (branchErr) {
    console.error('[ERROR] Failed to seed branches:', branchErr.message);
    process.exit(1);
  }
  console.log(`[1/7] Seeded ${officialBranches.length} official branches into public.branches`);

  // 2. Sync `auth.users` & `public.profiles`
  const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.error('[ERROR] Failed to list auth.users:', listErr.message);
    process.exit(1);
  }

  const allowedEmails = new Set(ACCOUNTS_TO_SEED.map((a) => a.email.toLowerCase()));
  for (const user of listData?.users || []) {
    const emailLower = (user.email || '').toLowerCase();
    if (!allowedEmails.has(emailLower)) {
      await supabaseAdmin.from('profiles').delete().eq('id', user.id);
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
  }

  const { data: refreshedUsers } = await supabaseAdmin.auth.admin.listUsers();
  const userByEmail = new Map(
    (refreshedUsers?.users || []).map((u) => [(u.email || '').toLowerCase(), u])
  );

  const profileIdByEmail = {};

  for (const acct of ACCOUNTS_TO_SEED) {
    const existing = userByEmail.get(acct.email.toLowerCase());
    let userId = existing?.id;

    const userMetadata = {
      role: acct.role,
      full_name: acct.full_name,
      branch_id: acct.branch_id,
      license_number: acct.license_number,
      prc_license_number: acct.prc_license_number,
      prc_expiry_date: acct.prc_expiry_date,
      theme_preference: acct.theme_preference || 'light',
      notification_prefs: {
        critical_clinical: true,
        cold_chain: true,
        inventory_alerts: true,
        sound_alerts: false,
      },
      is_active: true,
    };

    if (!userId) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: acct.email,
        password: acct.password,
        email_confirm: true,
        user_metadata: userMetadata,
      });
      if (createErr) {
        console.error(`[ERROR] Failed to create auth user ${acct.email}:`, createErr.message);
        process.exit(1);
      }
      userId = created.user.id;
    } else {
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: acct.password,
        email_confirm: true,
        user_metadata: userMetadata,
      });
      if (updErr) {
        console.error(`[ERROR] Failed to update auth user ${acct.email}:`, updErr.message);
        process.exit(1);
      }
    }

    const { error: profErr } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        email: acct.email,
        full_name: acct.full_name,
        role: acct.role,
        branch_id: acct.branch_id,
        license_number: acct.license_number,
        is_active: true,
      },
      { onConflict: 'id' }
    );

    if (profErr) {
      console.error(`[ERROR] Failed to upsert profile for ${acct.email}:`, profErr.message);
      process.exit(1);
    }

    await updateEnrichedProfile(userId, {
      prc_license_number: acct.prc_license_number,
      prc_expiry_date: acct.prc_expiry_date,
      theme_preference: acct.theme_preference || 'light',
      notification_prefs: userMetadata.notification_prefs,
    });

    profileIdByEmail[acct.email] = userId;
  }
  console.log(`[2/7] Synced ${ACCOUNTS_TO_SEED.length} staff & patient accounts with PRC credentials`);

  // 3. Seed FEFO `vaccine_inventory` across all 7 branches (with realistic stock variations for Predictive Stockout & Auto-Rebalancing)
  await supabaseAdmin
    .from('vaccine_inventory')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  const BRANCH_STOCK_PROFILE = {
    'santa-maria': { verorabNear: 5, verorabStd: 14, speeda: 18, erig: 14, tetanus: 38 },
    baliwag: { verorabNear: 4, verorabStd: 9, speeda: 11, erig: 9, tetanus: 30 },
    pandi: { verorabNear: 28, verorabStd: 42, speeda: 48, erig: 22, tetanus: 45 },
    drt: { verorabNear: 22, verorabStd: 35, speeda: 40, erig: 19, tetanus: 42 },
    'meycauayan-camalig': { verorabNear: 8, verorabStd: 20, speeda: 26, erig: 15, tetanus: 35 },
    'meycauayan-poblacion': { verorabNear: 6, verorabStd: 18, speeda: 22, erig: 12, tetanus: 32 },
    'cefels-caloocan': { verorabNear: 4, verorabStd: 8, speeda: 10, erig: 8, tetanus: 28 },
  };

  const inventoryRows = [];
  for (const b of officialBranches) {
    const code = b.id.slice(0, 3).toUpperCase();
    const prof = BRANCH_STOCK_PROFILE[b.id] || BRANCH_STOCK_PROFILE['santa-maria'];
    inventoryRows.push(
      {
        branch_id: b.id,
        item_name: 'Verorab PVRV (0.5mL ID/IM)',
        category: 'vaccine',
        batch_number: `VRB-FEFO-${code}-A`,
        stock_vials: prof.verorabNear,
        reorder_level: 12,
        expiry_date: addDays(todayIso(), 38),
      },
      {
        branch_id: b.id,
        item_name: 'Verorab PVRV (0.5mL ID/IM)',
        category: 'vaccine',
        batch_number: `VRB-2027-${code}-B`,
        stock_vials: prof.verorabStd,
        reorder_level: 15,
        expiry_date: '2027-10-30',
      },
      {
        branch_id: b.id,
        item_name: 'Speeda PVRV (Multi-Dose ID)',
        category: 'vaccine',
        batch_number: `SPD-2027-${code}`,
        stock_vials: prof.speeda,
        reorder_level: 15,
        expiry_date: '2027-08-15',
      },
      {
        branch_id: b.id,
        item_name: 'Equirab ERIG (200 IU/mL)',
        category: 'erig',
        batch_number: `EQR-2027-${code}`,
        stock_vials: prof.erig,
        reorder_level: 10,
        expiry_date: '2027-06-30',
      },
      {
        branch_id: b.id,
        item_name: 'Tetanus Toxoid (0.5mL IM)',
        category: 'tetanus',
        batch_number: `TTX-2028-${code}`,
        stock_vials: prof.tetanus,
        reorder_level: 15,
        expiry_date: '2028-03-31',
      }
    );
  }

  const { data: insertedInventory, error: invErr } = await supabaseAdmin
    .from('vaccine_inventory')
    .insert(inventoryRows)
    .select('*');
  if (invErr) {
    console.error('[ERROR] Failed to seed vaccine_inventory:', invErr.message);
    process.exit(1);
  }
  console.log(`[3/7] Seeded ${insertedInventory.length} FEFO inventory batches across 7 branches`);

  // 4. Clear and re-seed `pep_doses`, `clinical_cases`, `patients` across all 7 branches
  await supabaseAdmin.from('pep_doses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('clinical_cases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const today = todayIso();
  const doctorId = profileIdByEmail['doctor@victorioabc.ph'];
  const nurseId = profileIdByEmail['nurse@victorioabc.ph'];
  const baliwagNurseId = profileIdByEmail['nurse.baliwag@victorioabc.ph'];
  const baliwagDoctorId = profileIdByEmail['doctor.baliwag@victorioabc.ph'];
  const adminId = profileIdByEmail['admin@victorioabc.ph'];

  const PATIENT_SPECS = [
    // Santa Maria (6 patients covering all workflows)
    {
      patient_code: 'PT-STM-2026-001',
      branch_id: 'santa-maria',
      full_name: 'Mateo Villanueva',
      phone: '09171234501',
      address: 'Poblacion, Santa Maria, Bulacan',
      age: 29,
      sex: 'male',
    },
    {
      patient_code: 'PT-STM-2026-002',
      branch_id: 'santa-maria',
      full_name: 'Clarisse Dela Rosa',
      phone: '09182345602',
      address: 'Bagbaguin, Santa Maria, Bulacan',
      age: 34,
      sex: 'female',
    },
    {
      patient_code: 'PT-STM-2026-003',
      branch_id: 'santa-maria',
      full_name: 'Gabriel Pangilinan',
      phone: '09193456703',
      address: 'Caypombo, Santa Maria, Bulacan',
      age: 11,
      sex: 'male',
    },
    {
      patient_code: 'PT-STM-2026-004',
      branch_id: 'santa-maria',
      full_name: 'Lorna Macapagal',
      phone: '09204567804',
      address: 'Guyong, Santa Maria, Bulacan',
      age: 58,
      sex: 'female',
    },
    {
      patient_code: 'PT-STM-2026-005',
      branch_id: 'santa-maria',
      full_name: 'Enzo Navarro',
      phone: '09175550192',
      address: 'Pulong Buhangin, Santa Maria, Bulacan',
      age: 24,
      sex: 'male',
    },
    {
      patient_code: 'PT-STM-2026-006',
      branch_id: 'santa-maria',
      full_name: 'Marites Soriano',
      phone: '09186660215',
      address: 'San Vicente, Santa Maria, Bulacan',
      age: 42,
      sex: 'female',
    },
    // Baliwag (3 patients)
    {
      patient_code: 'PT-BAL-2026-001',
      branch_id: 'baliwag',
      full_name: 'Ricardo Tolentino',
      phone: '09215678905',
      address: 'Concepcion, Baliwag, Bulacan',
      age: 41,
      sex: 'male',
    },
    {
      patient_code: 'PT-BAL-2026-002',
      branch_id: 'baliwag',
      full_name: 'Sofia Evangelista',
      phone: '09226789006',
      address: 'Sabang, Baliwag, Bulacan',
      age: 22,
      sex: 'female',
    },
    {
      patient_code: 'PT-BAL-2026-003',
      branch_id: 'baliwag',
      full_name: 'Daniela Mercado',
      phone: '09178889104',
      address: 'Bagong Nayon, Baliwag, Bulacan',
      age: 19,
      sex: 'female',
    },
    // Other 5 Official Branches (for 7-Branch Comparison Matrix & 14-day Predictive Burn)
    {
      patient_code: 'PT-PAN-2026-001',
      branch_id: 'pandi',
      full_name: 'Jerome Pascual',
      phone: '09173019283',
      address: 'Mapulang Lupa, Pandi, Bulacan',
      age: 31,
      sex: 'male',
    },
    {
      patient_code: 'PT-DRT-2026-001',
      branch_id: 'drt',
      full_name: 'Ramoncito Sarmiento',
      phone: '09184029182',
      address: 'Pulong Sampalok, DRT, Bulacan',
      age: 47,
      sex: 'male',
    },
    {
      patient_code: 'PT-CAM-2026-001',
      branch_id: 'meycauayan-camalig',
      full_name: 'Beatriz Alcantara',
      phone: '09195018273',
      address: 'Camalig, Meycauayan, Bulacan',
      age: 27,
      sex: 'female',
    },
    {
      patient_code: 'PT-POB-2026-001',
      branch_id: 'meycauayan-poblacion',
      full_name: 'Arnel Manalili',
      phone: '09206019284',
      address: 'Calvario, Meycauayan, Bulacan',
      age: 36,
      sex: 'male',
    },
    {
      patient_code: 'PT-CAL-2026-001',
      branch_id: 'cefels-caloocan',
      full_name: 'Katrina Policarpio',
      phone: '09217019285',
      address: 'Cefels, Caloocan, Metro Manila',
      age: 30,
      sex: 'female',
    },
  ];

  const encryptedPatients = PATIENT_SPECS.map((p) => {
    const enc = encryptPatientRecord({
      full_name: p.full_name,
      phone: p.phone,
      address: p.address,
    });
    return {
      user_id: null,
      branch_id: p.branch_id,
      patient_code: p.patient_code,
      full_name_enc: enc.full_name_enc,
      phone_enc: enc.phone_enc,
      address_enc: enc.address_enc,
      age: p.age,
      sex: p.sex,
    };
  });

  const { data: insertedPatients, error: patErr } = await supabaseAdmin
    .from('patients')
    .insert(encryptedPatients)
    .select('id, patient_code, branch_id');
  if (patErr) {
    console.error('[ERROR] Failed to seed patients:', patErr.message);
    process.exit(1);
  }
  const patientByCode = new Map(insertedPatients.map((p) => [p.patient_code, p.id]));
  console.log(`[4/7] Seeded ${insertedPatients.length} AES-256-GCM encrypted patients across all 7 branches`);

  // 5. Seed `clinical_cases` with embedded extended metadata
  const CASE_SPECS = [
    {
      case_number: 'ABC-STM-2026-101',
      patient_code: 'PT-STM-2026-001',
      branch_id: 'santa-maria',
      animal_type: 'dog',
      exposure_category: 'III',
      wound_site: 'Right Hand & Thenar Web',
      exposure_date: today,
      status: 'queued_nurse',
      assessed_by: null,
      erig_required: true,
      tetanus_given: false,
      plain_notes: 'Walk-in stray dog bite on right hand; washed with soap and water for 15 mins. Synced with mobile AI pre-triage.',
      meta: {
        patient_weight_kg: 68,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Right Hand (High-Innervation Digits)',
        is_high_risk_cat3: true,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'ERIG (Equirab 200 IU/mL)',
        erig_hrig_iu: 2720,
        erig_hrig_ml: 13.6,
        doctor_prc_signoff_license: null,
        doctor_prc_signed_at: null,
        philhealth_abtp_validated: false,
      },
    },
    {
      case_number: 'ABC-STM-2026-102',
      patient_code: 'PT-STM-2026-002',
      branch_id: 'santa-maria',
      animal_type: 'cat',
      exposure_category: 'II',
      wound_site: 'Left Forearm',
      exposure_date: today,
      status: 'pending_doctor',
      assessed_by: null,
      erig_required: false,
      tetanus_given: true,
      plain_notes: 'Superficial domestic cat scratch with minor oozing; vitals stable, awaiting physician WHO verification & dosing sign-off.',
      meta: {
        patient_weight_kg: 54,
        prior_pep_within_3_months: false,
        allergies: 'Equine Serum Sensitivity (History of mild urticaria)',
        is_pregnant: true,
        anatomical_site: 'Left Forearm',
        is_high_risk_cat3: false,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'None',
        erig_hrig_iu: 0,
        erig_hrig_ml: 0,
        doctor_prc_signoff_license: null,
        doctor_prc_signed_at: null,
        philhealth_abtp_validated: false,
      },
    },
    {
      case_number: 'ABC-STM-2026-103',
      patient_code: 'PT-STM-2026-003',
      branch_id: 'santa-maria',
      animal_type: 'dog',
      exposure_category: 'III',
      wound_site: 'Lower Lip & Right Cheek (Facial)',
      exposure_date: addDays(today, -3),
      status: 'active_pep',
      assessed_by: doctorId,
      erig_required: true,
      tetanus_given: true,
      plain_notes: 'Category III pediatric facial laceration. ERIG infiltrated locally around wound margins on Day 0; Day 3 ID booster due today.',
      meta: {
        patient_weight_kg: 32,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Face / Lower Lip & Cheek (Cranial High-Risk)',
        is_high_risk_cat3: true,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'ERIG (Equirab 200 IU/mL)',
        erig_hrig_iu: 1280,
        erig_hrig_ml: 6.4,
        doctor_prc_signoff_license: 'PRC-0148291',
        doctor_prc_signed_at: addDays(today, -3) + 'T09:15:00.000Z',
        philhealth_abtp_validated: true,
      },
    },
    {
      case_number: 'ABC-STM-2026-104',
      patient_code: 'PT-STM-2026-004',
      branch_id: 'santa-maria',
      animal_type: 'dog',
      exposure_category: 'II',
      wound_site: 'Right Calf',
      exposure_date: addDays(today, -28),
      status: 'completed',
      assessed_by: doctorId,
      erig_required: false,
      tetanus_given: true,
      plain_notes: 'Completed full 5-dose intradermal PVRV regimen (Days 0, 3, 7, 14, 28) without adverse reactions.',
      meta: {
        patient_weight_kg: 61,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Right Calf',
        is_high_risk_cat3: false,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'None',
        erig_hrig_iu: 0,
        erig_hrig_ml: 0,
        doctor_prc_signoff_license: 'PRC-0148291',
        doctor_prc_signed_at: addDays(today, -28) + 'T10:30:00.000Z',
        philhealth_abtp_validated: true,
      },
    },
    {
      case_number: 'ABC-STM-2026-105',
      patient_code: 'PT-STM-2026-005',
      branch_id: 'santa-maria',
      animal_type: 'dog',
      exposure_category: 'III',
      wound_site: 'Neck & Left Shoulder',
      exposure_date: addDays(today, -8),
      status: 'active_pep',
      assessed_by: doctorId,
      erig_required: true,
      tetanus_given: true,
      plain_notes: 'High-risk Category III deep puncture near neck/shoulder. Patient missed scheduled Day 7 booster yesterday — priority defaulter call required.',
      meta: {
        patient_weight_kg: 72,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Neck & Left Shoulder (High-Risk Cranial/Cervical)',
        is_high_risk_cat3: true,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'ERIG (Equirab 200 IU/mL)',
        erig_hrig_iu: 2880,
        erig_hrig_ml: 14.4,
        doctor_prc_signoff_license: 'PRC-0148291',
        doctor_prc_signed_at: addDays(today, -8) + 'T11:20:00.000Z',
        philhealth_abtp_validated: true,
      },
    },
    {
      case_number: 'ABC-STM-2026-106',
      patient_code: 'PT-STM-2026-006',
      branch_id: 'santa-maria',
      animal_type: 'cat',
      exposure_category: 'II',
      wound_site: 'Left Thumb & Index Finger',
      exposure_date: today,
      status: 'pending_doctor',
      assessed_by: null,
      erig_required: false,
      tetanus_given: true,
      plain_notes: 'Re-exposure bite on left thumb; completed full 5-dose PEP 6 weeks ago. Eligible for 2-dose booster guardrail.',
      meta: {
        patient_weight_kg: 57,
        prior_pep_within_3_months: true,
        allergies: 'Penicillin',
        is_pregnant: false,
        anatomical_site: 'Left Thumb & Index Finger (Hand)',
        is_high_risk_cat3: false,
        regimen_type: '2-Dose Booster Regimen (Day 0, Day 3)',
        erig_hrig_type: 'None (Prior PEP < 3 Months)',
        erig_hrig_iu: 0,
        erig_hrig_ml: 0,
        doctor_prc_signoff_license: null,
        doctor_prc_signed_at: null,
        philhealth_abtp_validated: false,
      },
    },
    // Baliwag cases
    {
      case_number: 'ABC-BAL-2026-201',
      patient_code: 'PT-BAL-2026-001',
      branch_id: 'baliwag',
      animal_type: 'dog',
      exposure_category: 'III',
      wound_site: 'Left Ankle & Achilles',
      exposure_date: today,
      status: 'queued_nurse',
      assessed_by: null,
      erig_required: true,
      tetanus_given: false,
      plain_notes: 'Unprovoked stray dog bite on left ankle; bleeding controlled at triage.',
      meta: {
        patient_weight_kg: 74,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Left Ankle & Achilles',
        is_high_risk_cat3: true,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'ERIG (Equirab 200 IU/mL)',
        erig_hrig_iu: 2960,
        erig_hrig_ml: 14.8,
        doctor_prc_signoff_license: null,
        doctor_prc_signed_at: null,
        philhealth_abtp_validated: false,
      },
    },
    {
      case_number: 'ABC-BAL-2026-202',
      patient_code: 'PT-BAL-2026-002',
      branch_id: 'baliwag',
      animal_type: 'cat',
      exposure_category: 'II',
      wound_site: 'Right Wrist',
      exposure_date: addDays(today, -3),
      status: 'active_pep',
      assessed_by: baliwagDoctorId,
      erig_required: false,
      tetanus_given: true,
      plain_notes: 'Category II scratch on right wrist; Day 3 booster scheduled today.',
      meta: {
        patient_weight_kg: 49,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Right Wrist',
        is_high_risk_cat3: false,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'None',
        erig_hrig_iu: 0,
        erig_hrig_ml: 0,
        doctor_prc_signoff_license: 'PRC-0155402',
        doctor_prc_signed_at: addDays(today, -3) + 'T10:00:00.000Z',
        philhealth_abtp_validated: true,
      },
    },
    {
      case_number: 'ABC-BAL-2026-203',
      patient_code: 'PT-BAL-2026-003',
      branch_id: 'baliwag',
      animal_type: 'dog',
      exposure_category: 'III',
      wound_site: 'Right Hand Palm',
      exposure_date: addDays(today, -4),
      status: 'active_pep',
      assessed_by: baliwagDoctorId,
      erig_required: true,
      tetanus_given: true,
      plain_notes: 'Category III palm bite; missed Day 3 booster yesterday.',
      meta: {
        patient_weight_kg: 52,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Right Hand Palm',
        is_high_risk_cat3: true,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'ERIG (Equirab 200 IU/mL)',
        erig_hrig_iu: 2080,
        erig_hrig_ml: 10.4,
        doctor_prc_signoff_license: 'PRC-0155402',
        doctor_prc_signed_at: addDays(today, -4) + 'T14:20:00.000Z',
        philhealth_abtp_validated: true,
      },
    },
    // Active PEP cases in Pandi, DRT, Meycauayan Camalig, Meycauayan Poblacion, Cefels Caloocan
    {
      case_number: 'ABC-PAN-2026-301',
      patient_code: 'PT-PAN-2026-001',
      branch_id: 'pandi',
      animal_type: 'dog',
      exposure_category: 'II',
      wound_site: 'Left Leg',
      exposure_date: addDays(today, -3),
      status: 'active_pep',
      assessed_by: doctorId,
      erig_required: false,
      tetanus_given: true,
      plain_notes: 'Active PEP patient at Mapulang Lupa, Pandi branch.',
      meta: {
        patient_weight_kg: 65,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Left Leg',
        is_high_risk_cat3: false,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'None',
        erig_hrig_iu: 0,
        erig_hrig_ml: 0,
        doctor_prc_signoff_license: 'PRC-0148291',
        doctor_prc_signed_at: addDays(today, -3) + 'T09:00:00.000Z',
        philhealth_abtp_validated: true,
      },
    },
    {
      case_number: 'ABC-DRT-2026-401',
      patient_code: 'PT-DRT-2026-001',
      branch_id: 'drt',
      animal_type: 'dog',
      exposure_category: 'III',
      wound_site: 'Right Forearm',
      exposure_date: addDays(today, -3),
      status: 'active_pep',
      assessed_by: doctorId,
      erig_required: true,
      tetanus_given: true,
      plain_notes: 'Active PEP patient at DRT Bulacan branch.',
      meta: {
        patient_weight_kg: 70,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Right Forearm',
        is_high_risk_cat3: true,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'ERIG (Equirab 200 IU/mL)',
        erig_hrig_iu: 2800,
        erig_hrig_ml: 14.0,
        doctor_prc_signoff_license: 'PRC-0148291',
        doctor_prc_signed_at: addDays(today, -3) + 'T11:00:00.000Z',
        philhealth_abtp_validated: true,
      },
    },
    {
      case_number: 'ABC-CAM-2026-501',
      patient_code: 'PT-CAM-2026-001',
      branch_id: 'meycauayan-camalig',
      animal_type: 'cat',
      exposure_category: 'II',
      wound_site: 'Right Hand Dorsum',
      exposure_date: addDays(today, -3),
      status: 'active_pep',
      assessed_by: doctorId,
      erig_required: false,
      tetanus_given: true,
      plain_notes: 'Active PEP patient at Camalig Meycauayan branch.',
      meta: {
        patient_weight_kg: 53,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Right Hand Dorsum',
        is_high_risk_cat3: false,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'None',
        erig_hrig_iu: 0,
        erig_hrig_ml: 0,
        doctor_prc_signoff_license: 'PRC-0148291',
        doctor_prc_signed_at: addDays(today, -3) + 'T13:00:00.000Z',
        philhealth_abtp_validated: true,
      },
    },
    {
      case_number: 'ABC-POB-2026-601',
      patient_code: 'PT-POB-2026-001',
      branch_id: 'meycauayan-poblacion',
      animal_type: 'dog',
      exposure_category: 'II',
      wound_site: 'Left Shin',
      exposure_date: addDays(today, -3),
      status: 'active_pep',
      assessed_by: doctorId,
      erig_required: false,
      tetanus_given: true,
      plain_notes: 'Active PEP patient at Poblacion/Calvario Meycauayan branch.',
      meta: {
        patient_weight_kg: 66,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Left Shin',
        is_high_risk_cat3: false,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'None',
        erig_hrig_iu: 0,
        erig_hrig_ml: 0,
        doctor_prc_signoff_license: 'PRC-0148291',
        doctor_prc_signed_at: addDays(today, -3) + 'T15:00:00.000Z',
        philhealth_abtp_validated: true,
      },
    },
    {
      case_number: 'ABC-CAL-2026-701',
      patient_code: 'PT-CAL-2026-001',
      branch_id: 'cefels-caloocan',
      animal_type: 'dog',
      exposure_category: 'III',
      wound_site: 'Right Forearm & Wrist',
      exposure_date: addDays(today, -3),
      status: 'active_pep',
      assessed_by: doctorId,
      erig_required: true,
      tetanus_given: true,
      plain_notes: 'Active Category III PEP patient at Cefels Caloocan branch.',
      meta: {
        patient_weight_kg: 59,
        prior_pep_within_3_months: false,
        allergies: 'None reported',
        is_pregnant: false,
        anatomical_site: 'Right Forearm & Wrist',
        is_high_risk_cat3: true,
        regimen_type: 'Updated Thai Red Cross ID (5-Dose Day 0-3-7-14-28)',
        erig_hrig_type: 'ERIG (Equirab 200 IU/mL)',
        erig_hrig_iu: 2360,
        erig_hrig_ml: 11.8,
        doctor_prc_signoff_license: 'PRC-0148291',
        doctor_prc_signed_at: addDays(today, -3) + 'T16:00:00.000Z',
        philhealth_abtp_validated: true,
      },
    },
  ];

  const caseInsertPayloads = CASE_SPECS.map((c) => ({
    case_number: c.case_number,
    patient_id: patientByCode.get(c.patient_code),
    branch_id: c.branch_id,
    animal_type: c.animal_type,
    exposure_category: c.exposure_category,
    wound_site: c.wound_site,
    exposure_date: c.exposure_date,
    status: c.status,
    assessed_by: c.assessed_by,
    erig_required: c.erig_required,
    tetanus_given: c.tetanus_given,
    notes: packCaseNotes(c.plain_notes, c.meta),
  }));

  const { data: insertedCases, error: caseErr } = await supabaseAdmin
    .from('clinical_cases')
    .insert(caseInsertPayloads)
    .select('id, case_number, branch_id, patient_id, exposure_date, status');
  if (caseErr) {
    console.error('[ERROR] Failed to seed clinical_cases:', caseErr.message);
    process.exit(1);
  }
  const caseByNumber = new Map(insertedCases.map((c) => [c.case_number, c]));
  console.log(`[5/7] Seeded ${insertedCases.length} clinical_cases across all 7 branches`);

  // 6. Seed `pep_doses` across all active & completed cases (powering Today's Schedule, Risk-Stratified Defaulters & 14-Day Predictive Burn Rate)
  const DOSE_DAYS = [0, 3, 7, 14, 28];
  const pepDoseRows = [];

  function pushCaseDoses(caseNumber, baseDate, dayStatuses, brand = 'Verorab PVRV (0.5mL ID/IM)', lot = 'VRB-FEFO-STM-A', adminBy = nurseId) {
    const c = caseByNumber.get(caseNumber);
    if (!c) return;
    for (const day of DOSE_DAYS) {
      const st = dayStatuses[day] || 'scheduled';
      const sched = addDays(baseDate, day);
      pepDoseRows.push({
        case_id: c.id,
        branch_id: c.branch_id,
        dose_day: day,
        scheduled_date: sched,
        administered_at: st === 'completed' ? `${sched}T09:30:00.000Z` : null,
        administered_by: st === 'completed' ? adminBy : null,
        vaccine_brand: st === 'completed' ? brand : null,
        lot_number: st === 'completed' ? `${lot} • PRC-0892341` : null,
        status: st,
      });
    }
  }

  // ABC-STM-2026-103: Day 0 completed 3 days ago, Day 3 due TODAY, Days 7/14/28 scheduled
  pushCaseDoses('ABC-STM-2026-103', addDays(today, -3), {
    0: 'completed',
    3: 'scheduled',
    7: 'scheduled',
    14: 'scheduled',
    28: 'scheduled',
  });

  // ABC-STM-2026-104: All 5 doses completed
  pushCaseDoses('ABC-STM-2026-104', addDays(today, -28), {
    0: 'completed',
    3: 'completed',
    7: 'completed',
    14: 'completed',
    28: 'completed',
  });

  // ABC-STM-2026-105 (Cat III Neck/Shoulder): Day 0 & Day 3 completed, Day 7 MISSED yesterday (High-Risk Cat III Defaulter!), Day 14 & 28 scheduled
  pushCaseDoses('ABC-STM-2026-105', addDays(today, -8), {
    0: 'completed',
    3: 'completed',
    7: 'missed',
    14: 'scheduled',
    28: 'scheduled',
  });

  // ABC-BAL-2026-202: Day 0 completed, Day 3 due TODAY
  pushCaseDoses(
    'ABC-BAL-2026-202',
    addDays(today, -3),
    { 0: 'completed', 3: 'scheduled', 7: 'scheduled', 14: 'scheduled', 28: 'scheduled' },
    'Speeda PVRV (Multi-Dose ID)',
    'SPD-2027-BAL',
    baliwagNurseId
  );

  // ABC-BAL-2026-203 (Cat III Palm): Day 0 completed, Day 3 MISSED yesterday
  pushCaseDoses(
    'ABC-BAL-2026-203',
    addDays(today, -4),
    { 0: 'completed', 3: 'missed', 7: 'scheduled', 14: 'scheduled', 28: 'scheduled' },
    'Verorab PVRV (0.5mL ID/IM)',
    'VRB-FEFO-BAL-A',
    baliwagNurseId
  );

  // Other 5 branches active PEP schedules
  for (const cn of [
    'ABC-PAN-2026-301',
    'ABC-DRT-2026-401',
    'ABC-CAM-2026-501',
    'ABC-POB-2026-601',
    'ABC-CAL-2026-701',
  ]) {
    pushCaseDoses(cn, addDays(today, -3), {
      0: 'completed',
      3: 'scheduled',
      7: 'scheduled',
      14: 'scheduled',
      28: 'scheduled',
    });
  }

  const { data: insertedDoses, error: doseErr } = await supabaseAdmin
    .from('pep_doses')
    .insert(pepDoseRows)
    .select('*');
  if (doseErr) {
    console.error('[ERROR] Failed to seed pep_doses:', doseErr.message);
    process.exit(1);
  }
  console.log(`[6/7] Seeded ${insertedDoses.length} pep_doses across all 7 branches`);

  // 7. Seed Phase 2.3 Intelligence Collections in live Supabase
  const stmCase101 = caseByNumber.get('ABC-STM-2026-101');
  const stmCase102 = caseByNumber.get('ABC-STM-2026-102');
  const stmCase103 = caseByNumber.get('ABC-STM-2026-103');
  const stmCase104 = caseByNumber.get('ABC-STM-2026-104');
  const stmCase105 = caseByNumber.get('ABC-STM-2026-105');
  const stmCase106 = caseByNumber.get('ABC-STM-2026-106');
  const balCase201 = caseByNumber.get('ABC-BAL-2026-201');
  const balCase202 = caseByNumber.get('ABC-BAL-2026-202');
  const balCase203 = caseByNumber.get('ABC-BAL-2026-203');

  // 7a. ai_triage_submissions
  const aiSubmissions = [
    {
      id: crypto.randomUUID(),
      case_id: stmCase101.id,
      patient_id: stmCase101.patient_id,
      branch_id: 'santa-maria',
      wound_image_url: buildWoundSvgDataUrl({
        label: 'Transdermal Puncture + Active Oozing',
        site: 'Right Hand & Thenar Web',
        category: 'III',
        borderColor: '#DC2626',
        bgColor: '#FEF2F2',
      }),
      ai_predicted_category: 'III',
      confidence_score: 96.4,
      anatomical_risk_flags: [
        'High-Innervation Extremity (Right Hand Digits)',
        'Transdermal Dermis Breach Detected',
        'Active Capillary Bleeding Flagged',
      ],
      verification_status: 'pending',
      doctor_final_category: null,
      override_reason: null,
      verified_by: null,
      verified_at: null,
      created_at: hoursFromNowIso(-0.8),
    },
    {
      id: crypto.randomUUID(),
      case_id: stmCase102.id,
      patient_id: stmCase102.patient_id,
      branch_id: 'santa-maria',
      wound_image_url: buildWoundSvgDataUrl({
        label: 'Linear Epidermal Abrasion',
        site: 'Left Forearm (Distal)',
        category: 'II',
        borderColor: '#D97706',
        bgColor: '#FFFBEB',
      }),
      ai_predicted_category: 'II',
      confidence_score: 91.8,
      anatomical_risk_flags: [
        'Superficial Scratch Without Spontaneous Bleeding',
        'Non-Cranial Upper Extremity',
      ],
      verification_status: 'pending',
      doctor_final_category: null,
      override_reason: null,
      verified_by: null,
      verified_at: null,
      created_at: hoursFromNowIso(-1.5),
    },
    {
      id: crypto.randomUUID(),
      case_id: stmCase106.id,
      patient_id: stmCase106.patient_id,
      branch_id: 'santa-maria',
      wound_image_url: buildWoundSvgDataUrl({
        label: 'Minor Claw Abrasion on Thumb',
        site: 'Left Thumb & Index Finger',
        category: 'III',
        borderColor: '#DC2626',
        bgColor: '#FEF2F2',
      }),
      ai_predicted_category: 'III',
      confidence_score: 78.5,
      anatomical_risk_flags: [
        'Hand / Digit Anatomical Proximity Alert',
        'Prior PEP < 3 Months Recorded in History',
      ],
      verification_status: 'pending',
      doctor_final_category: null,
      override_reason: null,
      verified_by: null,
      verified_at: null,
      created_at: hoursFromNowIso(-0.4),
    },
    {
      id: crypto.randomUUID(),
      case_id: stmCase103.id,
      patient_id: stmCase103.patient_id,
      branch_id: 'santa-maria',
      wound_image_url: buildWoundSvgDataUrl({
        label: 'Deep Facial Bite Laceration',
        site: 'Lower Lip & Right Cheek',
        category: 'III',
        borderColor: '#DC2626',
        bgColor: '#FEF2F2',
      }),
      ai_predicted_category: 'III',
      confidence_score: 98.9,
      anatomical_risk_flags: [
        'CRITICAL: Cranial / Facial Exposure',
        'Mucosal Proximity (Lower Lip)',
        'Immediate ERIG Infiltration Mandatory',
      ],
      verification_status: 'confirmed',
      doctor_final_category: 'III',
      override_reason: null,
      verified_by: doctorId,
      verified_at: addDays(today, -3) + 'T09:14:00.000Z',
      created_at: addDays(today, -3) + 'T08:50:00.000Z',
    },
    {
      id: crypto.randomUUID(),
      case_id: stmCase104.id,
      patient_id: stmCase104.patient_id,
      branch_id: 'santa-maria',
      wound_image_url: buildWoundSvgDataUrl({
        label: 'Superficial Tooth Graze',
        site: 'Right Calf',
        category: 'I',
        borderColor: '#0284C7',
        bgColor: '#F0F9FF',
      }),
      ai_predicted_category: 'I',
      confidence_score: 74.2,
      anatomical_risk_flags: ['Low-Lighting Shadow Artifact on Dermis'],
      verification_status: 'overridden',
      doctor_final_category: 'II',
      override_reason: 'Physical alcohol swab test confirmed micro-abrasion of epidermis; upgraded from Cat I to Cat II PEP.',
      verified_by: doctorId,
      verified_at: addDays(today, -28) + 'T10:25:00.000Z',
      created_at: addDays(today, -28) + 'T09:55:00.000Z',
    },
    {
      id: crypto.randomUUID(),
      case_id: balCase201.id,
      patient_id: balCase201.patient_id,
      branch_id: 'baliwag',
      wound_image_url: buildWoundSvgDataUrl({
        label: 'Deep Canine Puncture Wound',
        site: 'Left Ankle & Achilles',
        category: 'III',
        borderColor: '#DC2626',
        bgColor: '#FEF2F2',
      }),
      ai_predicted_category: 'III',
      confidence_score: 95.1,
      anatomical_risk_flags: ['Deep Subcutaneous Puncture', 'Stray Canine Source'],
      verification_status: 'pending',
      doctor_final_category: null,
      override_reason: null,
      verified_by: null,
      verified_at: null,
      created_at: hoursFromNowIso(-1.1),
    },
  ];
  await seedLiveCollection('ai_triage_submissions', aiSubmissions);

  // 7b. reconstituted_vials (Active 6-hour vials + completed/expired history for yield analytics)
  const stmFefoBatch = insertedInventory.find(
    (i) => i.branch_id === 'santa-maria' && i.category === 'vaccine'
  );
  const balFefoBatch = insertedInventory.find(
    (i) => i.branch_id === 'baliwag' && i.category === 'vaccine'
  );

  const reconstitutedVials = [
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      inventory_id: stmFefoBatch?.id || null,
      vaccine_name: 'Verorab PVRV (0.5mL Multi-Dose ID)',
      lot_number: 'VRB-FEFO-STM-A',
      opened_at: hoursFromNowIso(-2.25),
      expires_at: hoursFromNowIso(3.75),
      total_doses: 5,
      administered_doses: 3,
      wasted_doses: 0,
      opened_by: nurseId,
      status: 'active',
      created_at: hoursFromNowIso(-2.25),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      inventory_id: stmFefoBatch?.id || null,
      vaccine_name: 'Speeda PVRV (Multi-Dose ID)',
      lot_number: 'SPD-2027-STM',
      opened_at: hoursFromNowIso(-5.35),
      expires_at: hoursFromNowIso(0.65), // < 1 hour remaining warning!
      total_doses: 5,
      administered_doses: 4,
      wasted_doses: 0,
      opened_by: nurseId,
      status: 'active',
      created_at: hoursFromNowIso(-5.35),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      inventory_id: stmFefoBatch?.id || null,
      vaccine_name: 'Verorab PVRV (0.5mL Multi-Dose ID)',
      lot_number: 'VRB-FEFO-STM-A',
      opened_at: hoursFromNowIso(-22),
      expires_at: hoursFromNowIso(-16),
      total_doses: 5,
      administered_doses: 5,
      wasted_doses: 0,
      opened_by: nurseId,
      status: 'exhausted',
      created_at: hoursFromNowIso(-22),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'baliwag',
      inventory_id: balFefoBatch?.id || null,
      vaccine_name: 'Verorab PVRV (0.5mL Multi-Dose ID)',
      lot_number: 'VRB-FEFO-BAL-A',
      opened_at: hoursFromNowIso(-1.5),
      expires_at: hoursFromNowIso(4.5),
      total_doses: 5,
      administered_doses: 2,
      wasted_doses: 0,
      opened_by: baliwagNurseId,
      status: 'active',
      created_at: hoursFromNowIso(-1.5),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'baliwag',
      inventory_id: balFefoBatch?.id || null,
      vaccine_name: 'Speeda PVRV (Multi-Dose ID)',
      lot_number: 'SPD-2027-BAL',
      opened_at: hoursFromNowIso(-26),
      expires_at: hoursFromNowIso(-20),
      total_doses: 5,
      administered_doses: 3,
      wasted_doses: 2,
      opened_by: baliwagNurseId,
      status: 'expired',
      created_at: hoursFromNowIso(-26),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'pandi',
      inventory_id: null,
      vaccine_name: 'Verorab PVRV (0.5mL Multi-Dose ID)',
      lot_number: 'VRB-FEFO-PAN-A',
      opened_at: hoursFromNowIso(-18),
      expires_at: hoursFromNowIso(-12),
      total_doses: 5,
      administered_doses: 5,
      wasted_doses: 0,
      opened_by: nurseId,
      status: 'exhausted',
      created_at: hoursFromNowIso(-18),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'drt',
      inventory_id: null,
      vaccine_name: 'Verorab PVRV (0.5mL Multi-Dose ID)',
      lot_number: 'VRB-FEFO-DRT-A',
      opened_at: hoursFromNowIso(-15),
      expires_at: hoursFromNowIso(-9),
      total_doses: 5,
      administered_doses: 4,
      wasted_doses: 1,
      opened_by: nurseId,
      status: 'expired',
      created_at: hoursFromNowIso(-15),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'meycauayan-camalig',
      inventory_id: null,
      vaccine_name: 'Speeda PVRV (Multi-Dose ID)',
      lot_number: 'SPD-2027-MEY',
      opened_at: hoursFromNowIso(-14),
      expires_at: hoursFromNowIso(-8),
      total_doses: 5,
      administered_doses: 5,
      wasted_doses: 0,
      opened_by: nurseId,
      status: 'exhausted',
      created_at: hoursFromNowIso(-14),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'meycauayan-poblacion',
      inventory_id: null,
      vaccine_name: 'Verorab PVRV (0.5mL Multi-Dose ID)',
      lot_number: 'VRB-FEFO-MEY-A',
      opened_at: hoursFromNowIso(-12),
      expires_at: hoursFromNowIso(-6),
      total_doses: 5,
      administered_doses: 4,
      wasted_doses: 1,
      opened_by: nurseId,
      status: 'expired',
      created_at: hoursFromNowIso(-12),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'cefels-caloocan',
      inventory_id: null,
      vaccine_name: 'Speeda PVRV (Multi-Dose ID)',
      lot_number: 'SPD-2027-CEF',
      opened_at: hoursFromNowIso(-20),
      expires_at: hoursFromNowIso(-14),
      total_doses: 5,
      administered_doses: 3,
      wasted_doses: 2,
      opened_by: nurseId,
      status: 'expired',
      created_at: hoursFromNowIso(-20),
    },
  ];
  await seedLiveCollection('reconstituted_vials', reconstitutedVials);

  // 7c. cold_chain_logs across all 7 branches
  const coldChainLogs = [
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      temperature_c: 4.2,
      is_breach: false,
      shift_label: 'Morning Shift (08:00 AM)',
      recorded_by: nurseId,
      recorded_at: hoursFromNowIso(-3),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      temperature_c: 4.6,
      is_breach: false,
      shift_label: 'Midday Check (12:00 PM)',
      recorded_by: nurseId,
      recorded_at: hoursFromNowIso(-0.5),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'baliwag',
      temperature_c: 5.1,
      is_breach: false,
      shift_label: 'Morning Shift (08:00 AM)',
      recorded_by: baliwagNurseId,
      recorded_at: hoursFromNowIso(-2.5),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'pandi',
      temperature_c: 3.8,
      is_breach: false,
      shift_label: 'Morning Shift (08:00 AM)',
      recorded_by: nurseId,
      recorded_at: hoursFromNowIso(-2),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'drt',
      temperature_c: 4.5,
      is_breach: false,
      shift_label: 'Morning Shift (08:00 AM)',
      recorded_by: nurseId,
      recorded_at: hoursFromNowIso(-2),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'meycauayan-camalig',
      temperature_c: 4.9,
      is_breach: false,
      shift_label: 'Morning Shift (08:00 AM)',
      recorded_by: nurseId,
      recorded_at: hoursFromNowIso(-1.8),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'meycauayan-poblacion',
      temperature_c: 5.3,
      is_breach: false,
      shift_label: 'Morning Shift (08:00 AM)',
      recorded_by: nurseId,
      recorded_at: hoursFromNowIso(-1.7),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'cefels-caloocan',
      temperature_c: 8.6,
      is_breach: true,
      shift_label: 'Afternoon Check (02:00 PM)',
      recorded_by: profileIdByEmail['nurse.caloocan@victorioabc.ph'],
      recorded_at: hoursFromNowIso(-0.9),
    },
  ];
  await seedLiveCollection('cold_chain_logs', coldChainLogs);

  // 7d. billing_transactions across all 7 branches (Cash, GCash/Maya, Card, HMO, PhilHealth ABTP)
  const billingTransactions = [
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      case_id: stmCase101.id,
      patient_id: stmCase101.patient_id,
      amount_php: 4850,
      discount_php: 0,
      payment_method: 'cash',
      status: 'paid',
      void_reason: null,
      created_by: nurseId,
      created_at: hoursFromNowIso(-0.7),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      case_id: stmCase102.id,
      patient_id: stmCase102.patient_id,
      amount_php: 1850,
      discount_php: 200,
      payment_method: 'gcash_maya',
      status: 'paid',
      void_reason: null,
      created_by: nurseId,
      created_at: hoursFromNowIso(-1.4),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      case_id: stmCase103.id,
      patient_id: stmCase103.patient_id,
      amount_php: 5800,
      discount_php: 0,
      payment_method: 'philhealth_abtp',
      status: 'pending_philhealth',
      void_reason: null,
      created_by: doctorId,
      created_at: hoursFromNowIso(-2.2),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      case_id: stmCase105.id,
      patient_id: stmCase105.patient_id,
      amount_php: 3200,
      discount_php: 0,
      payment_method: 'card',
      status: 'paid',
      void_reason: null,
      created_by: nurseId,
      created_at: hoursFromNowIso(-3.1),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'baliwag',
      case_id: balCase201.id,
      patient_id: balCase201.patient_id,
      amount_php: 4600,
      discount_php: 0,
      payment_method: 'cash',
      status: 'paid',
      void_reason: null,
      created_by: baliwagNurseId,
      created_at: hoursFromNowIso(-1.2),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'baliwag',
      case_id: balCase202.id,
      patient_id: balCase202.patient_id,
      amount_php: 1950,
      discount_php: 0,
      payment_method: 'gcash_maya',
      status: 'paid',
      void_reason: null,
      created_by: baliwagNurseId,
      created_at: hoursFromNowIso(-2.0),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'baliwag',
      case_id: balCase203.id,
      patient_id: balCase203.patient_id,
      amount_php: 5800,
      discount_php: 0,
      payment_method: 'philhealth_abtp',
      status: 'pending_philhealth',
      void_reason: null,
      created_by: baliwagDoctorId,
      created_at: hoursFromNowIso(-3.5),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'pandi',
      case_id: caseByNumber.get('ABC-PAN-2026-301').id,
      patient_id: caseByNumber.get('ABC-PAN-2026-301').patient_id,
      amount_php: 3750,
      discount_php: 0,
      payment_method: 'cash',
      status: 'paid',
      void_reason: null,
      created_by: nurseId,
      created_at: hoursFromNowIso(-2.4),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'drt',
      case_id: caseByNumber.get('ABC-DRT-2026-401').id,
      patient_id: caseByNumber.get('ABC-DRT-2026-401').patient_id,
      amount_php: 4200,
      discount_php: 0,
      payment_method: 'hmo',
      status: 'paid',
      void_reason: null,
      created_by: nurseId,
      created_at: hoursFromNowIso(-2.8),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'meycauayan-camalig',
      case_id: caseByNumber.get('ABC-CAM-2026-501').id,
      patient_id: caseByNumber.get('ABC-CAM-2026-501').patient_id,
      amount_php: 3900,
      discount_php: 0,
      payment_method: 'gcash_maya',
      status: 'paid',
      void_reason: null,
      created_by: nurseId,
      created_at: hoursFromNowIso(-2.6),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'meycauayan-poblacion',
      case_id: caseByNumber.get('ABC-POB-2026-601').id,
      patient_id: caseByNumber.get('ABC-POB-2026-601').patient_id,
      amount_php: 3450,
      discount_php: 0,
      payment_method: 'card',
      status: 'paid',
      void_reason: null,
      created_by: nurseId,
      created_at: hoursFromNowIso(-2.9),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'cefels-caloocan',
      case_id: caseByNumber.get('ABC-CAL-2026-701').id,
      patient_id: caseByNumber.get('ABC-CAL-2026-701').patient_id,
      amount_php: 5800,
      discount_php: 0,
      payment_method: 'philhealth_abtp',
      status: 'pending_philhealth',
      void_reason: null,
      created_by: doctorId,
      created_at: hoursFromNowIso(-1.9),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'cefels-caloocan',
      case_id: caseByNumber.get('ABC-CAL-2026-701').id,
      patient_id: caseByNumber.get('ABC-CAL-2026-701').patient_id,
      amount_php: 4950,
      discount_php: 0,
      payment_method: 'cash',
      status: 'paid',
      void_reason: null,
      created_by: nurseId,
      created_at: hoursFromNowIso(-1.5),
    },
  ];
  await seedLiveCollection('billing_transactions', billingTransactions);

  // 7e. aefi_reports
  const aefiReports = [
    {
      id: crypto.randomUUID(),
      case_id: stmCase103.id,
      branch_id: 'santa-maria',
      doctor_id: doctorId,
      severity: 'mild',
      symptoms: 'Localized erythema (1.5 cm) and mild tenderness at right deltoid ID injection site 24 hours post-Day 0 dose.',
      action_taken: 'Advised cold compress and oral Cetirizine 10mg OD PRN; cleared to continue Day 3 PEP schedule.',
      created_at: addDays(today, -2) + 'T14:10:00.000Z',
    },
  ];
  await seedLiveCollection('aefi_reports', aefiReports);

  // 7f. defaulter_call_logs
  const missedStmDose = insertedDoses.find(
    (d) => d.case_id === stmCase105.id && d.status === 'missed'
  );
  const defaulterCallLogs = missedStmDose
    ? [
        {
          id: crypto.randomUUID(),
          dose_id: missedStmDose.id,
          case_id: stmCase105.id,
          branch_id: 'santa-maria',
          nurse_id: nurseId,
          outcome: 'Reached — Confirmed Afternoon Arrival',
          notes: 'Spoke with patient Enzo Navarro; delayed by work shift in Meycauayan, arriving at Santa Maria clinic by 4:00 PM today for Day 7 booster.',
          called_at: hoursFromNowIso(-1.2),
        },
      ]
    : [];
  await seedLiveCollection('defaulter_call_logs', defaulterCallLogs);

  // 7g. audit_logs (Immutable Governance Feed)
  const auditLogs = [
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      actor_id: doctorId,
      actor_name: 'Dr. Maria Santos, MD (PRC-0148291)',
      action_type: 'PRC_CLINICAL_SIGNOFF',
      entity_type: 'clinical_cases',
      reason: 'Digital PRC Sign-Off & PhilHealth ABTP Package Validation for Case ABC-STM-2026-103 (Cat III Facial Bite, ERIG 1,280 IU / 6.4 mL).',
      metadata: { case_number: 'ABC-STM-2026-103', prc_license: 'PRC-0148291', erig_ml: 6.4 },
      created_at: addDays(today, -3) + 'T09:15:00.000Z',
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      actor_id: doctorId,
      actor_name: 'Dr. Maria Santos, MD (PRC-0148291)',
      action_type: 'AI_TRIAGE_OVERRIDE',
      entity_type: 'ai_triage_submissions',
      reason: 'Upgraded mobile AI prediction from Category I to Category II after alcohol swab test confirmed micro-abrasion on right calf.',
      metadata: { case_number: 'ABC-STM-2026-104', ai_predicted: 'I', doctor_final: 'II' },
      created_at: addDays(today, -28) + 'T10:25:00.000Z',
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'cefels-caloocan',
      actor_id: profileIdByEmail['nurse.caloocan@victorioabc.ph'],
      actor_name: 'Nurse Mark Bautista, RN (PRC-0948105)',
      action_type: 'COLD_CHAIN_BREACH_ALERT',
      entity_type: 'cold_chain_logs',
      reason: 'Vaccine refrigerator logged 8.6°C during Afternoon Check (above 8.0°C WHO threshold). Backup stabilizer activated.',
      metadata: { temperature_c: 8.6, threshold: '2.0°C - 8.0°C' },
      created_at: hoursFromNowIso(-0.9),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      actor_id: nurseId,
      actor_name: 'Nurse Camille Reyes, RN (PRC-0892341)',
      action_type: 'VIAL_RECONSTITUTED',
      entity_type: 'reconstituted_vials',
      reason: 'Opened multi-dose Verorab PVRV vial (Lot VRB-FEFO-STM-A); 6-hour countdown timer initiated (5 ID doses capacity).',
      metadata: { lot_number: 'VRB-FEFO-STM-A', total_doses: 5 },
      created_at: hoursFromNowIso(-2.25),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'santa-maria',
      actor_id: nurseId,
      actor_name: 'Nurse Camille Reyes, RN (PRC-0892341)',
      action_type: 'PWD_SENIOR_DISCOUNT_APPLIED',
      entity_type: 'billing_transactions',
      reason: 'Applied ₱200.00 statutory discount on Case ABC-STM-2026-102 (GCash payment verified).',
      metadata: { case_number: 'ABC-STM-2026-102', discount_php: 200 },
      created_at: hoursFromNowIso(-1.4),
    },
    {
      id: crypto.randomUUID(),
      branch_id: 'baliwag',
      actor_id: baliwagDoctorId,
      actor_name: 'Dr. Rafael Villanueva, MD (PRC-0155402)',
      action_type: 'PRC_CLINICAL_SIGNOFF',
      entity_type: 'clinical_cases',
      reason: 'Digital PRC Sign-Off & PhilHealth ABTP Validation for Case ABC-BAL-2026-203 (Cat III Palm Bite).',
      metadata: { case_number: 'ABC-BAL-2026-203', prc_license: 'PRC-0155402' },
      created_at: addDays(today, -4) + 'T14:20:00.000Z',
    },
  ];
  await seedLiveCollection('audit_logs', auditLogs);

  console.log('[7/7] Seeded AI triage submissions, reconstituted vials, cold-chain logs, billing, AEFI, defaulter calls & audit logs!\n');
  console.log('=== PHASE 2.3 LIVE SUPABASE SEED COMPLETE ===');
}

seedAll().catch((err) => {
  console.error('[FATAL] seed-all.js failed:', err);
  process.exit(1);
});

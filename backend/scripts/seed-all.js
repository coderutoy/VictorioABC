import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { encryptPatientRecord } from '../utils/encryption.js';

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
  // Safely evaluate the array literal from branches.js
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
    full_name: 'Clinic Administrator',
    license_number: null,
    is_active: true,
  },
  {
    email: 'patient@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'patient',
    branch_id: null,
    full_name: 'Juan Dela Cruz',
    license_number: null,
    is_active: true,
  },
  {
    email: 'doctor@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'doctor',
    branch_id: 'santa-maria',
    full_name: 'Dr. Maria Santos',
    license_number: 'PRC-0148291',
    is_active: true,
  },
  {
    email: 'nurse@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'nurse',
    branch_id: 'santa-maria',
    full_name: 'Nurse Camille Reyes',
    license_number: 'PRC-0892341',
    is_active: true,
  },
  {
    email: 'nurse.baliwag@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'nurse',
    branch_id: 'baliwag',
    full_name: 'Nurse Paolo Mendoza',
    license_number: 'PRC-0911204',
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

async function seedAll() {
  console.log('=== Victorio ABC Phase 2.2b: Seeding All 6 Live Supabase Tables ===\n');

  // 1. Seed `branches` from web/src/config/branches.js
  const officialBranches = loadBranchesFromFrontendConfig();
  const { error: branchErr } = await supabaseAdmin
    .from('branches')
    .upsert(officialBranches, { onConflict: 'id' });
  if (branchErr) {
    console.error('[ERROR] Failed to seed branches:', branchErr.message);
    process.exit(1);
  }
  console.log(`[1/5] Seeded ${officialBranches.length} official branches into public.branches`);

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
      console.log(`      Deleted obsolete account: ${user.email}`);
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

    profileIdByEmail[acct.email] = userId;

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
  }
  console.log(`[2/5] Synced ${ACCOUNTS_TO_SEED.length} accounts in auth.users & public.profiles`);

  // 3. Seed starter `vaccine_inventory` batches for all 7 branches (idempotent)
  const { data: existingInv } = await supabaseAdmin
    .from('vaccine_inventory')
    .select('id, branch_id, item_name, batch_number');

  const existingInvKeySet = new Set(
    (existingInv || []).map((r) => `${r.branch_id}::${r.item_name}::${r.batch_number}`)
  );

  const starterItems = [
    {
      item_name: 'Verorab PVRV',
      category: 'vaccine',
      batch_prefix: 'VRB-2026',
      stock_vials: 48,
      reorder_level: 12,
      expiry_date: '2027-11-30',
    },
    {
      item_name: 'Speeda PVRV',
      category: 'vaccine',
      batch_prefix: 'SPD-2026',
      stock_vials: 64,
      reorder_level: 15,
      expiry_date: '2027-12-31',
    },
    {
      item_name: 'Equirab ERIG',
      category: 'erig',
      batch_prefix: 'EQR-2026',
      stock_vials: 9, // intentionally <= reorder_level (10) so Low-Stock KPI has a real alert
      reorder_level: 10,
      expiry_date: '2027-09-30',
    },
    {
      item_name: 'Tetanus Toxoid',
      category: 'tetanus',
      batch_prefix: 'TTX-2026',
      stock_vials: 52,
      reorder_level: 15,
      expiry_date: '2028-03-31',
    },
  ];

  const invToInsert = [];
  for (const branch of officialBranches) {
    const code = branch.id.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
    for (const item of starterItems) {
      const batchNumber = `${item.batch_prefix}-${code}`;
      const key = `${branch.id}::${item.item_name}::${batchNumber}`;
      if (!existingInvKeySet.has(key)) {
        invToInsert.push({
          branch_id: branch.id,
          item_name: item.item_name,
          category: item.category,
          batch_number: batchNumber,
          stock_vials: item.stock_vials,
          reorder_level: item.reorder_level,
          expiry_date: item.expiry_date,
        });
      }
    }
  }

  if (invToInsert.length > 0) {
    const { error: invErr } = await supabaseAdmin.from('vaccine_inventory').insert(invToInsert);
    if (invErr) {
      console.error('[ERROR] Failed to insert starter vaccine_inventory:', invErr.message);
      process.exit(1);
    }
  }
  console.log(`[3/5] Seeded starter vaccine_inventory batches across all 7 branches`);

  // 4. Seed AES-256-GCM encrypted `patients`, `clinical_cases` (all 4 statuses), and `pep_doses`
  const today = todayIso();
  const threeDaysAgo = addDays(today, -3);
  const sevenDaysAgo = addDays(today, -7);
  const twentyEightDaysAgo = addDays(today, -28);

  const samplePatients = [
    {
      patient_code: 'PT-SM-2026-001',
      branch_id: 'santa-maria',
      user_id: profileIdByEmail['patient@victorioabc.ph'] || null,
      full_name: 'Juan Dela Cruz',
      phone: '09171234501',
      address: 'Poblacion, Santa Maria, Bulacan',
      age: 31,
      sex: 'male',
    },
    {
      patient_code: 'PT-SM-2026-002',
      branch_id: 'santa-maria',
      user_id: null,
      full_name: 'Elena Reyes-Mercado',
      phone: '09182345602',
      address: 'Bagbaguin, Santa Maria, Bulacan',
      age: 26,
      sex: 'female',
    },
    {
      patient_code: 'PT-SM-2026-003',
      branch_id: 'santa-maria',
      user_id: null,
      full_name: 'Marco Antonio Villanueva',
      phone: '09193456703',
      address: 'Cay Pombo, Santa Maria, Bulacan',
      age: 14,
      sex: 'male',
    },
    {
      patient_code: 'PT-SM-2026-004',
      branch_id: 'santa-maria',
      user_id: null,
      full_name: 'Lorna Bautista-Lim',
      phone: '09204567804',
      address: 'Guyong, Santa Maria, Bulacan',
      age: 52,
      sex: 'female',
    },
    {
      patient_code: 'PT-BAL-2026-001',
      branch_id: 'baliwag',
      user_id: null,
      full_name: 'Roberto Carlos Pascual',
      phone: '09215678905',
      address: 'Bagong Nayon, Baliwag, Bulacan',
      age: 38,
      sex: 'male',
    },
    {
      patient_code: 'PT-BAL-2026-002',
      branch_id: 'baliwag',
      user_id: null,
      full_name: 'Clarissa Mae Evangelista',
      phone: '09226789006',
      address: 'Concepcion, Baliwag, Bulacan',
      age: 22,
      sex: 'female',
    },
    {
      patient_code: 'PT-BAL-2026-003',
      branch_id: 'baliwag',
      user_id: null,
      full_name: 'Gabriel Mateo Dizon',
      phone: '09237890107',
      address: 'Sabang, Baliwag, Bulacan',
      age: 41,
      sex: 'male',
    },
    {
      patient_code: 'PT-BAL-2026-004',
      branch_id: 'baliwag',
      user_id: null,
      full_name: 'Teresita Gomez-Navarro',
      phone: '09248901208',
      address: 'San Jose, Baliwag, Bulacan',
      age: 60,
      sex: 'female',
    },
  ];

  const patientIdByCode = {};
  for (const p of samplePatients) {
    const enc = encryptPatientRecord(p);
    const { data: upsertedPat, error: patErr } = await supabaseAdmin
      .from('patients')
      .upsert(
        {
          patient_code: p.patient_code,
          branch_id: p.branch_id,
          user_id: p.user_id,
          full_name_enc: enc.full_name_enc,
          phone_enc: enc.phone_enc,
          address_enc: enc.address_enc,
          age: p.age,
          sex: p.sex,
        },
        { onConflict: 'patient_code' }
      )
      .select('id, patient_code')
      .single();

    if (patErr) {
      console.error(`[ERROR] Failed to upsert patient ${p.patient_code}:`, patErr.message);
      process.exit(1);
    }
    patientIdByCode[p.patient_code] = upsertedPat.id;
  }

  const doctorId = profileIdByEmail['doctor@victorioabc.ph'];
  const nurseSmId = profileIdByEmail['nurse@victorioabc.ph'];
  const nurseBalId = profileIdByEmail['nurse.baliwag@victorioabc.ph'];

  const sampleCases = [
    // Santa Maria — all 4 statuses
    {
      case_number: 'ABC-2026-1001',
      patient_code: 'PT-SM-2026-001',
      branch_id: 'santa-maria',
      animal_type: 'dog',
      exposure_category: null,
      wound_site: 'Right hand (index finger)',
      exposure_date: today,
      status: 'queued_nurse',
      assessed_by: null,
      erig_required: false,
      tetanus_given: false,
      notes: 'Walk-in arrival. Wound washed with soap and running water for 15 minutes at intake.',
    },
    {
      case_number: 'ABC-2026-1002',
      patient_code: 'PT-SM-2026-002',
      branch_id: 'santa-maria',
      animal_type: 'cat',
      exposure_category: 'II',
      wound_site: 'Left forearm scratch',
      exposure_date: today,
      status: 'pending_doctor',
      assessed_by: null,
      erig_required: false,
      tetanus_given: true,
      notes: 'Vitals stable (BP 118/76, 56 kg). Ready for physician WHO Category validation.',
    },
    {
      case_number: 'ABC-2026-1003',
      patient_code: 'PT-SM-2026-003',
      branch_id: 'santa-maria',
      animal_type: 'dog',
      exposure_category: 'III',
      wound_site: 'Right lower calf (transdermal puncture)',
      exposure_date: threeDaysAgo,
      status: 'active_pep',
      assessed_by: doctorId,
      erig_required: true,
      tetanus_given: true,
      notes: 'WHO Category III exposure. Equirab ERIG infiltrated on Day 0; Day 3 PEP dose due today.',
    },
    {
      case_number: 'ABC-2026-1004',
      patient_code: 'PT-SM-2026-004',
      branch_id: 'santa-maria',
      animal_type: 'dog',
      exposure_category: 'II',
      wound_site: 'Left ankle superficial abrasion',
      exposure_date: twentyEightDaysAgo,
      status: 'completed',
      assessed_by: doctorId,
      erig_required: false,
      tetanus_given: true,
      notes: 'Completed full 5-milestone PEP regimen (Day 0 to Day 28). Biting dog alive and healthy.',
    },

    // Baliwag — all 4 statuses
    {
      case_number: 'ABC-2026-2001',
      patient_code: 'PT-BAL-2026-001',
      branch_id: 'baliwag',
      animal_type: 'dog',
      exposure_category: null,
      wound_site: 'Left thumb & palm',
      exposure_date: today,
      status: 'queued_nurse',
      assessed_by: null,
      erig_required: false,
      tetanus_given: false,
      notes: 'Walk-in patient awaiting initial nurse triage assessment.',
    },
    {
      case_number: 'ABC-2026-2002',
      patient_code: 'PT-BAL-2026-002',
      branch_id: 'baliwag',
      animal_type: 'cat',
      exposure_category: 'II',
      wound_site: 'Right wrist scratch',
      exposure_date: today,
      status: 'pending_doctor',
      assessed_by: null,
      erig_required: false,
      tetanus_given: true,
      notes: 'Nurse triage complete. Forwarded to physician for PEP schedule approval.',
    },
    {
      case_number: 'ABC-2026-2003',
      patient_code: 'PT-BAL-2026-003',
      branch_id: 'baliwag',
      animal_type: 'dog',
      exposure_category: 'III',
      wound_site: 'Right hand dorsum (bleeding bite)',
      exposure_date: sevenDaysAgo,
      status: 'active_pep',
      assessed_by: doctorId,
      erig_required: true,
      tetanus_given: true,
      notes: 'WHO Category III bite. Day 0 and Day 3 completed; Day 7 dose scheduled for today.',
    },
    {
      case_number: 'ABC-2026-2004',
      patient_code: 'PT-BAL-2026-004',
      branch_id: 'baliwag',
      animal_type: 'cat',
      exposure_category: 'I',
      wound_site: 'Intact skin contact on hand',
      exposure_date: today,
      status: 'completed',
      assessed_by: doctorId,
      erig_required: false,
      tetanus_given: false,
      notes: 'WHO Category I (lick on intact skin). Thorough 15-min soap wash & counseling completed.',
    },
  ];

  const caseByNumber = {};
  for (const c of sampleCases) {
    const { data: upsertedCase, error: caseErr } = await supabaseAdmin
      .from('clinical_cases')
      .upsert(
        {
          case_number: c.case_number,
          patient_id: patientIdByCode[c.patient_code],
          branch_id: c.branch_id,
          animal_type: c.animal_type,
          exposure_category: c.exposure_category,
          wound_site: c.wound_site,
          exposure_date: c.exposure_date,
          status: c.status,
          assessed_by: c.assessed_by,
          erig_required: c.erig_required,
          tetanus_given: c.tetanus_given,
          notes: c.notes,
        },
        { onConflict: 'case_number' }
      )
      .select('*')
      .single();

    if (caseErr) {
      console.error(`[ERROR] Failed to upsert clinical_case ${c.case_number}:`, caseErr.message);
      process.exit(1);
    }
    caseByNumber[c.case_number] = upsertedCase;
  }

  // 5. Seed matching `pep_doses` for active_pep and completed cases (idempotent)
  const casesWithDoses = [
    {
      case_number: 'ABC-2026-1003', // Santa Maria active_pep (Day 0 done 3 days ago, Day 3 due TODAY)
      day0: threeDaysAgo,
      branch_id: 'santa-maria',
      nurse_id: nurseSmId,
      completedDays: [0],
      brand: 'Speeda PVRV',
      lot: 'SPD-2026-SAN',
    },
    {
      case_number: 'ABC-2026-1004', // Santa Maria completed (all 5 doses completed)
      day0: twentyEightDaysAgo,
      branch_id: 'santa-maria',
      nurse_id: nurseSmId,
      completedDays: [0, 3, 7, 14, 28],
      brand: 'Verorab PVRV',
      lot: 'VRB-2026-SAN',
    },
    {
      case_number: 'ABC-2026-2003', // Baliwag active_pep (Day 0 & Day 3 done, Day 7 due TODAY)
      day0: sevenDaysAgo,
      branch_id: 'baliwag',
      nurse_id: nurseBalId,
      completedDays: [0, 3],
      brand: 'Speeda PVRV',
      lot: 'SPD-2026-BAL',
    },
  ];

  for (const cfg of casesWithDoses) {
    const cRow = caseByNumber[cfg.case_number];
    if (!cRow) continue;

    // Clear and re-insert the 5 milestone doses so re-running seed-all.js is strictly idempotent
    await supabaseAdmin.from('pep_doses').delete().eq('case_id', cRow.id);

    const doseRows = [0, 3, 7, 14, 28].map((dayOffset) => {
      const schedDate = addDays(cfg.day0, dayOffset);
      const isDone = cfg.completedDays.includes(dayOffset);
      return {
        case_id: cRow.id,
        branch_id: cfg.branch_id,
        dose_day: dayOffset,
        scheduled_date: schedDate,
        administered_at: isDone ? `${schedDate}T09:30:00.000Z` : null,
        administered_by: isDone ? cfg.nurse_id : null,
        vaccine_brand: cfg.brand,
        lot_number: isDone ? cfg.lot : null,
        status: isDone ? 'completed' : 'scheduled',
      };
    });

    const { error: doseErr } = await supabaseAdmin.from('pep_doses').insert(doseRows);
    if (doseErr) {
      console.error(`[ERROR] Failed to seed pep_doses for ${cfg.case_number}:`, doseErr.message);
      process.exit(1);
    }
  }
  console.log(`[4/5] Seeded encrypted patients, clinical_cases (all 4 statuses), and pep_doses`);

  // 6. Print final row counts for all 6 tables
  console.log('\n=== [5/5] Live Supabase Table Row Counts ===');
  for (const table of [
    'branches',
    'profiles',
    'patients',
    'clinical_cases',
    'pep_doses',
    'vaccine_inventory',
  ]) {
    const { count, error } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`  ${table.padEnd(20)} -> ERROR: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ${table.padEnd(20)} -> ${count} rows`);
  }
}

seedAll();

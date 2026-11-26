import { supabaseAdmin } from '../config/supabase.js';
import { encryptPatientPII } from '../utils/crypto.js';

const MAIN_BRANCH_ID = '11111111-1111-1111-1111-111111111101';
const MUZON_BRANCH_ID = '11111111-1111-1111-1111-111111111102';
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'VictorioABC@2026';

export const DEMO_ACCOUNTS = [
  {
    email: 'admin@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'admin',
    full_name: 'Dr. Victorio Central Admin',
    phone: '+63-917-555-0100',
    license_number: 'PRC-ADM-202600',
    branch_id: null,
  },
  {
    email: 'doctor.main@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'doctor',
    full_name: 'Dr. Maria Santos, MD',
    phone: '+63-917-555-0101',
    license_number: 'PRC-MD-104829',
    branch_id: MAIN_BRANCH_ID,
  },
  {
    email: 'nurse.main@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'nurse',
    full_name: 'RN Angela Reyes',
    phone: '+63-917-555-0102',
    license_number: 'PRC-RN-209381',
    branch_id: MAIN_BRANCH_ID,
  },
  {
    email: 'nurse.muzon@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'nurse',
    full_name: 'RN Carlo Mendoza',
    phone: '+63-917-555-0103',
    license_number: 'PRC-RN-209412',
    branch_id: MUZON_BRANCH_ID,
  },
  {
    email: 'patient@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'patient',
    full_name: 'Juan Dela Cruz',
    phone: '+63-917-555-0199',
    license_number: null,
    branch_id: null,
  },
];

async function seedAccounts() {
  console.log('--- Provisioning Victorio ABC Accounts in Supabase ---');
  const { data: existingList, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list Supabase Auth users:', listErr.message);
    process.exit(1);
  }

  const existingByEmail = new Map(
    (existingList?.users || []).map((u) => [u.email?.toLowerCase(), u])
  );

  for (const acct of DEMO_ACCOUNTS) {
    let userId = existingByEmail.get(acct.email.toLowerCase())?.id;

    if (!userId) {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: acct.email,
        password: acct.password,
        email_confirm: true,
        user_metadata: {
          role: acct.role,
          full_name: acct.full_name,
          phone: acct.phone,
          branch_id: acct.branch_id || '',
        },
      });

      if (createErr) {
        console.error(`[Auth] Failed to create ${acct.email}:`, createErr.message);
        continue;
      }
      userId = created.user.id;
      console.log(`[Auth] Created user: ${acct.email} (${acct.role}) -> ${userId}`);
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: acct.password,
        email_confirm: true,
        user_metadata: {
          role: acct.role,
          full_name: acct.full_name,
          phone: acct.phone,
          branch_id: acct.branch_id || '',
        },
      });
      console.log(`[Auth] Updated existing user: ${acct.email} (${acct.role}) -> ${userId}`);
    }

    // Attempt to upsert into public.profiles if schema migrations have been applied
    const { error: profileErr } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        branch_id: acct.role === 'nurse' || acct.role === 'doctor' ? acct.branch_id : null,
        role: acct.role,
        full_name: acct.full_name,
        phone: acct.phone,
        email: acct.email,
        license_number: acct.license_number,
        is_active: true,
      },
      { onConflict: 'id' }
    );

    if (profileErr) {
      console.warn(
        `[Profiles] Skipping public.profiles upsert for ${acct.email} (${profileErr.message})`
      );
    } else {
      console.log(`[Profiles] Synced public.profiles row for ${acct.email}`);
    }

    if (acct.role === 'patient' && !profileErr) {
      const encrypted = encryptPatientPII({
        phone: acct.phone,
        address: 'Blk 8 Lot 15 Quirino Highway',
        government_id: 'PHILHEALTH-12-345678901-2',
      });
      await supabaseAdmin.from('patients').upsert(
        {
          profile_id: userId,
          registered_branch_id: MAIN_BRANCH_ID,
          qr_code_hash: 'VABC-DEMO2026PASS',
          full_name: acct.full_name,
          phone: encrypted.phone,
          birthdate: '1998-05-14',
          gender: 'male',
          address: encrypted.address,
          barangay: 'Tungkong Mangga',
          municipality: 'San Jose del Monte',
        },
        { onConflict: 'profile_id' }
      );
      console.log('[Patients] Synced encrypted patient record (QR: VABC-DEMO2026PASS)');
    }
  }
}

seedAccounts();

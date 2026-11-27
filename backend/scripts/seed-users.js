import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../src/config/supabase.js';

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'VictorioABC@2026';

/**
 * Outdated test accounts that MUST be deleted from Supabase auth.users and public.profiles.
 */
const DEPRECATED_EMAILS = [
  'nurse.muzon@victorioabc.ph',
  'nurse.main@victorioabc.ph',
  'doctor.main@victorioabc.ph',
];

/**
 * 7 Official Victorio ABC branches matching web/src/config/branches.js.
 */
export const OFFICIAL_BRANCHES_SEED = [
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

/**
 * 5 Official Phase 2.2 Working Accounts (password: VictorioABC@2026).
 */
export const WORKING_ACCOUNTS = [
  {
    email: 'admin@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'admin',
    full_name: 'Branch Administrator',
    branch_id: 'santa-maria',
    license_number: 'ADM-SM-2026',
    is_active: true,
  },
  {
    email: 'doctor@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'doctor',
    full_name: 'Dr. Maria Santos',
    branch_id: 'santa-maria',
    license_number: 'PRC-MD-104829',
    is_active: true,
  },
  {
    email: 'nurse@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'nurse',
    full_name: 'Nurse Camille Reyes',
    branch_id: 'santa-maria',
    license_number: 'PRC-RN-209381',
    is_active: true,
  },
  {
    email: 'patient@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'patient',
    full_name: 'Juan Dela Cruz',
    branch_id: 'santa-maria',
    license_number: null,
    is_active: true,
  },
  {
    email: 'nurse.baliwag@victorioabc.ph',
    password: DEFAULT_PASSWORD,
    role: 'nurse',
    full_name: 'Nurse Paolo Mendoza',
    branch_id: 'baliwag',
    license_number: 'PRC-RN-209412',
    is_active: true,
  },
];

async function seedUsersAndVerify() {
  console.log('=== Victorio ABC Phase 2.2: Replacing Default Accounts & Seeding Live Users ===');

  const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list Supabase Auth users:', listErr.message);
    process.exit(1);
  }

  const allUsers = listData?.users || [];
  const allowedEmails = new Set(WORKING_ACCOUNTS.map((a) => a.email.toLowerCase()));

  // 1. Delete deprecated / old test accounts from auth.users (and public.profiles if table exists)
  for (const user of allUsers) {
    const emailLower = (user.email || '').toLowerCase();
    if (DEPRECATED_EMAILS.includes(emailLower) || !allowedEmails.has(emailLower)) {
      await supabaseAdmin.from('profiles').delete().eq('id', user.id);
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (delErr) {
        console.warn(`[Cleanup] Failed to delete ${user.email}: ${delErr.message}`);
      } else {
        console.log(`[Cleanup] Removed deprecated account: ${user.email} (${user.id})`);
      }
    }
  }

  // 2. Seed branches into public.branches if table exists
  const { error: branchCheckErr } = await supabaseAdmin
    .from('branches')
    .upsert(OFFICIAL_BRANCHES_SEED, { onConflict: 'id' });
  if (!branchCheckErr) {
    console.log('[Branches] Seeded all 7 official branches into public.branches');
  } else {
    console.log(`[Branches] public.branches table check: ${branchCheckErr.message}`);
  }

  // Re-fetch user list after cleanup
  const { data: refreshedList } = await supabaseAdmin.auth.admin.listUsers();
  const existingByEmail = new Map(
    (refreshedList?.users || []).map((u) => [(u.email || '').toLowerCase(), u])
  );

  // 3. Create or update the 5 official working accounts
  for (const acct of WORKING_ACCOUNTS) {
    const existing = existingByEmail.get(acct.email.toLowerCase());
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
        console.error(`[Auth] Failed to create ${acct.email}:`, createErr.message);
        process.exit(1);
      }
      userId = created.user.id;
      console.log(
        `[Auth] Created account: ${acct.email} | role=${acct.role} | branch_id=${acct.branch_id} | id=${userId}`
      );
    } else {
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: acct.password,
        email_confirm: true,
        user_metadata: userMetadata,
      });
      if (updateErr) {
        console.error(`[Auth] Failed to update ${acct.email}:`, updateErr.message);
        process.exit(1);
      }
      console.log(
        `[Auth] Updated account: ${acct.email} | role=${acct.role} | branch_id=${acct.branch_id} | id=${userId}`
      );
    }

    // Upsert into public.profiles if the table exists
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

    if (!profErr) {
      console.log(`[Profiles] Upserted public.profiles row for ${acct.email}`);
    }
  }

  // 4. Verify live signInWithPassword for every single account using the public anon key
  console.log('\n=== Verifying Live Supabase Auth Sign-In for All 5 Accounts ===');
  const anonClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  for (const acct of WORKING_ACCOUNTS) {
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: acct.email,
      password: acct.password,
    });
    if (error || !data?.user) {
      console.error(`[VERIFY FAIL] ${acct.email}: ${error?.message}`);
      process.exit(1);
    }
    const meta = data.user.user_metadata || {};
    console.log(
      `[VERIFY OK] ${acct.email.padEnd(28)} -> role=${meta.role} | branch_id=${meta.branch_id} | full_name=${meta.full_name}`
    );
  }
}

seedUsersAndVerify();

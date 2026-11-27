import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../config/supabase.js';
import { AppError, asyncHandler } from '../../middleware/error.middleware.js';

export const CROSS_BRANCH_DENIED_MESSAGE =
  'Access denied: Your account is assigned to a different branch and cannot sign in from this branch location.';

/**
 * Canonical 7-branch lookup table matching web/src/config/branches.js and supabase/seed.sql.
 */
export const OFFICIAL_BRANCH_MAP = Object.freeze({
  baliwag: '11111111-1111-1111-1111-111111111101',
  'santa-maria': '11111111-1111-1111-1111-111111111102',
  pandi: '11111111-1111-1111-1111-111111111103',
  drt: '11111111-1111-1111-1111-111111111104',
  'meycauayan-camalig': '11111111-1111-1111-1111-111111111105',
  'meycauayan-poblacion': '11111111-1111-1111-1111-111111111106',
  'cefels-caloocan': '11111111-1111-1111-1111-111111111107',
});

const VALID_BRANCH_IDS = new Set(Object.values(OFFICIAL_BRANCH_MAP));

export function resolveClientBranchId(req) {
  const rawBranchId =
    req.body?.branch_id ||
    req.headers['x-branch-id'] ||
    req.query?.branch_id ||
    '';
  const rawBranchSlug =
    req.body?.branch_slug ||
    req.body?.branch_code ||
    req.headers['x-branch-slug'] ||
    req.query?.branch_slug ||
    '';

  const trimmedId = String(rawBranchId).trim().toLowerCase();
  if (VALID_BRANCH_IDS.has(trimmedId)) {
    return trimmedId;
  }
  if (OFFICIAL_BRANCH_MAP[trimmedId]) {
    return OFFICIAL_BRANCH_MAP[trimmedId];
  }

  const trimmedSlug = String(rawBranchSlug).trim().toLowerCase();
  if (OFFICIAL_BRANCH_MAP[trimmedSlug]) {
    return OFFICIAL_BRANCH_MAP[trimmedSlug];
  }
  if (VALID_BRANCH_IDS.has(trimmedSlug)) {
    return trimmedSlug;
  }

  return trimmedId || null;
}

export function resolveAssignedBranchId(rawBranchValue) {
  if (!rawBranchValue) return null;
  const cleaned = String(rawBranchValue).trim().toLowerCase();
  if (!cleaned) return null;
  if (VALID_BRANCH_IDS.has(cleaned)) return cleaned;
  if (OFFICIAL_BRANCH_MAP[cleaned]) return OFFICIAL_BRANCH_MAP[cleaned];
  return cleaned;
}

/**
 * Checks whether a user profile is permitted to sign in from the active client branch.
 * - Branch-bound staff (doctor, nurse, and any admin with an assigned branch_id) MUST match activeBranchId.
 * - Throws HTTP 403 Forbidden if the account belongs to a different branch.
 */
export function assertBranchLoginAllowed(profile, activeBranchId) {
  if (!profile) {
    throw new AppError('Unable to verify account profile.', 403);
  }

  const role = String(profile.role || 'patient').toLowerCase();
  const assignedBranchId = resolveAssignedBranchId(profile.branch_id);
  const isSuperAdmin =
    Boolean(profile.super_admin) ||
    (role === 'admin' && !assignedBranchId);

  // Enforce strict branch matching on all branch-bound staff accounts
  const isBranchBoundStaff =
    role === 'doctor' ||
    role === 'nurse' ||
    (role === 'admin' && !isSuperAdmin);

  if (isBranchBoundStaff) {
    if (!assignedBranchId || !activeBranchId || assignedBranchId !== activeBranchId) {
      throw new AppError(CROSS_BRANCH_DENIED_MESSAGE, 403);
    }
  } else if (assignedBranchId && activeBranchId && assignedBranchId !== activeBranchId) {
    throw new AppError(CROSS_BRANCH_DENIED_MESSAGE, 403);
  }
}

function createEphemeralAuthClient() {
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'placeholder-anon-key';

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function loadUserProfile(authUser) {
  const { data: profileRow } = await supabaseAdmin
    .from('profiles')
    .select('id, branch_id, role, full_name, phone, email, license_number, notif_pref, is_active')
    .eq('id', authUser.id)
    .maybeSingle();

  const meta = authUser.user_metadata || {};
  return (
    profileRow || {
      id: authUser.id,
      branch_id: meta.branch_id || null,
      role: meta.role || 'patient',
      full_name: meta.full_name || authUser.email || 'Victorio ABC User',
      phone: meta.phone || null,
      email: authUser.email || null,
      license_number: meta.license_number || null,
      notif_pref: 'all',
      is_active: true,
    }
  );
}

/**
 * POST /api/v1/auth/login
 * Authenticates credentials and strictly enforces branch-locked login before returning any session/JWT.
 */
export const loginWithBranchLock = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  const activeBranchId = resolveClientBranchId(req);

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  if (!activeBranchId) {
    throw new AppError('Active branch context (branch_id) is required to sign in.', 400);
  }

  const authClient = createEphemeralAuthClient();
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.user || !authData?.session) {
    throw new AppError(
      authError?.message || 'Invalid email or password. Please check your credentials.',
      401
    );
  }

  const resolvedProfile = await loadUserProfile(authData.user);

  if (resolvedProfile.is_active === false) {
    throw new AppError('Account is deactivated. Contact Central Admin.', 403);
  }

  // Strictly enforce cross-branch login blocking (returns 403 and withholds session/JWT if mismatched)
  assertBranchLoginAllowed(resolvedProfile, activeBranchId);

  const isPatient = String(resolvedProfile.role).toLowerCase() === 'patient';

  res.status(200).json({
    success: true,
    data: {
      // Do not issue a web clinical portal session for patient accounts; redirect them to the mobile app screen
      session: isPatient ? null : authData.session,
      user: isPatient ? null : authData.user,
      profile: resolvedProfile,
      role: resolvedProfile.role,
      active_branch_id: activeBranchId,
      require_mobile_app: isPatient,
      redirect_to: isPatient ? '/mobile-app' : '/dashboard',
    },
  });
});

/**
 * POST /api/v1/auth/verify-branch
 * Verifies an existing bearer token against the client's active branch_id.
 */
export const verifyBranchSession = asyncHandler(async (req, res) => {
  const activeBranchId = resolveClientBranchId(req);
  if (!activeBranchId) {
    throw new AppError('Active branch context (branch_id) is required.', 400);
  }

  assertBranchLoginAllowed(req.user, activeBranchId);

  const isPatient = String(req.user?.role).toLowerCase() === 'patient';
  res.status(200).json({
    success: true,
    data: {
      profile: req.user,
      role: req.user.role,
      active_branch_id: activeBranchId,
      require_mobile_app: isPatient,
      redirect_to: isPatient ? '/mobile-app' : '/dashboard',
    },
  });
});

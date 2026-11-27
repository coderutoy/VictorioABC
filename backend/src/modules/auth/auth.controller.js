import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin, supabaseUrl, supabaseAnonKey } from '../../config/supabase.js';
import { AppError, asyncHandler } from '../../middleware/error.middleware.js';

export const CROSS_BRANCH_DENIED_MESSAGE =
  'Access denied: Your account is assigned to a different branch and cannot sign in from this branch location.';

/**
 * Canonical 7-branch lookup table matching web/src/config/branches.js and supabase/migrations/20261127_core_clinical_tables.sql.
 * Maps both branch slugs and legacy UUIDs to canonical branch slug IDs.
 */
export const OFFICIAL_BRANCH_SLUGS = Object.freeze([
  'baliwag',
  'santa-maria',
  'pandi',
  'drt',
  'meycauayan-camalig',
  'meycauayan-poblacion',
  'cefels-caloocan',
]);

const LEGACY_UUID_TO_SLUG = Object.freeze({
  '11111111-1111-1111-1111-111111111101': 'baliwag',
  '11111111-1111-1111-1111-111111111102': 'santa-maria',
  '11111111-1111-1111-1111-111111111103': 'pandi',
  '11111111-1111-1111-1111-111111111104': 'drt',
  '11111111-1111-1111-1111-111111111105': 'meycauayan-camalig',
  '11111111-1111-1111-1111-111111111106': 'meycauayan-poblacion',
  '11111111-1111-1111-1111-111111111107': 'cefels-caloocan',
});

const VALID_SLUG_SET = new Set(OFFICIAL_BRANCH_SLUGS);

const ROLE_HOME_PATHS = Object.freeze({
  admin: '/dashboard/admin',
  nurse: '/dashboard/nurse',
  doctor: '/dashboard/doctor',
  patient: '/mobile-app-only',
});

function roleHomePath(role) {
  return ROLE_HOME_PATHS[String(role || '').toLowerCase()] || '/login';
}

export function normalizeBranchId(rawVal) {
  if (!rawVal) return null;
  const cleaned = String(rawVal).trim().toLowerCase();
  if (!cleaned) return null;
  if (VALID_SLUG_SET.has(cleaned)) return cleaned;
  if (LEGACY_UUID_TO_SLUG[cleaned]) return LEGACY_UUID_TO_SLUG[cleaned];
  return cleaned;
}

export function resolveClientBranchId(req) {
  const candidates = [
    req.body?.branch_id,
    req.body?.branch_slug,
    req.body?.branch_code,
    req.headers['x-branch-id'],
    req.headers['x-branch-slug'],
    req.query?.branch_id,
    req.query?.branch_slug,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeBranchId(candidate);
    if (normalized) return normalized;
  }
  return null;
}

export function resolveAssignedBranchId(rawBranchValue) {
  return normalizeBranchId(rawBranchValue);
}

/**
 * Checks whether a user profile is permitted to sign in from the active client branch.
 * - All branch-assigned accounts (admin, doctor, nurse) must match activeBranchId.
 * - Throws HTTP 403 Forbidden if the account belongs to a different branch.
 */
export function assertBranchLoginAllowed(profile, activeBranchId) {
  if (!profile) {
    throw new AppError('Unable to verify account profile.', 403);
  }

  const role = String(profile.role || 'patient').toLowerCase();
  const assignedBranchId = normalizeBranchId(profile.branch_id);
  const clientBranchId = normalizeBranchId(activeBranchId);

  const isSuperAdmin = Boolean(profile.super_admin);
  const isStaff = role === 'doctor' || role === 'nurse' || (role === 'admin' && !isSuperAdmin);

  if (isStaff) {
    if (assignedBranchId && clientBranchId && assignedBranchId !== clientBranchId) {
      throw new AppError(CROSS_BRANCH_DENIED_MESSAGE, 403);
    }
    if ((role === 'doctor' || role === 'nurse') && (!assignedBranchId || !clientBranchId)) {
      throw new AppError(CROSS_BRANCH_DENIED_MESSAGE, 403);
    }
  } else if (assignedBranchId && clientBranchId && assignedBranchId !== clientBranchId) {
    throw new AppError(CROSS_BRANCH_DENIED_MESSAGE, 403);
  }
}

function createEphemeralAuthClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function loadUserProfile(authUser) {
  const { data: profileRow, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, branch_id, license_number, is_active, created_at')
    .eq('id', authUser.id)
    .maybeSingle();

  const meta = authUser.user_metadata || {};
  if (!error && profileRow) {
    return {
      ...profileRow,
      branch_id: normalizeBranchId(profileRow.branch_id || meta.branch_id),
    };
  }

  return {
    id: authUser.id,
    email: authUser.email || null,
    full_name: meta.full_name || authUser.email || 'Victorio ABC User',
    role: meta.role || 'patient',
    branch_id: normalizeBranchId(meta.branch_id) || 'santa-maria',
    license_number: meta.license_number || null,
    is_active: meta.is_active !== false,
  };
}

/**
 * POST /api/v1/auth/login
 * Authenticates credentials and strictly enforces branch-locked login before returning any session/JWT.
 */
export const loginWithBranchLock = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  const activeBranchId = resolveClientBranchId(req) || 'santa-maria';

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
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
      session: isPatient ? null : authData.session,
      user: isPatient ? null : authData.user,
      profile: resolvedProfile,
      role: resolvedProfile.role,
      active_branch_id: activeBranchId,
      require_mobile_app: isPatient,
      redirect_to: roleHomePath(resolvedProfile.role),
    },
  });
});

/**
 * POST /api/v1/auth/verify-branch
 * Verifies an existing bearer token against the client's active branch_id.
 */
export const verifyBranchSession = asyncHandler(async (req, res) => {
  const activeBranchId = resolveClientBranchId(req) || 'santa-maria';

  assertBranchLoginAllowed(req.user, activeBranchId);

  const isPatient = String(req.user?.role).toLowerCase() === 'patient';
  res.status(200).json({
    success: true,
    data: {
      profile: req.user,
      role: req.user.role,
      active_branch_id: activeBranchId,
      require_mobile_app: isPatient,
      redirect_to: roleHomePath(req.user.role),
    },
  });
});

import { supabaseAdmin, createUserSupabaseClient } from '../src/config/supabase.js';
import { AppError, asyncHandler } from '../src/middleware/error.middleware.js';
import { normalizeBranchId } from '../src/modules/auth/auth.controller.js';

/**
 * Extracts `Authorization: Bearer <access_token>`, verifies via `supabaseAdmin.auth.getUser(token)`,
 * loads the user's row from `public.profiles`, and enforces branch access rules:
 * - For `doctor` and `nurse`: rejects with 403 if `X-Branch-Id` (or `req.query.branch_id`) is missing or `!== profile.branch_id`.
 * - For `admin`: allows any valid `X-Branch-Id` (or all branches when querying global summaries).
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError('Missing or malformed Authorization header.', 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new AppError('Empty bearer token.', 401);
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    throw new AppError('Invalid or expired authentication token.', 401);
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const meta = user.user_metadata || {};
  const role = String(profile?.role || meta.role || 'patient').toLowerCase();
  const rawBranchId =
    profile?.branch_id !== undefined ? profile.branch_id : meta.branch_id || null;
  const assignedBranchId =
    role === 'admin' || role === 'patient'
      ? normalizeBranchId(rawBranchId) || null
      : normalizeBranchId(rawBranchId);

  const prcLicense =
    profile?.prc_license_number ||
    meta.prc_license_number ||
    profile?.license_number ||
    meta.license_number ||
    null;

  const resolvedProfile = {
    id: user.id,
    branch_id: assignedBranchId,
    role,
    full_name: profile?.full_name || meta.full_name || user.email || 'Victorio ABC User',
    email: profile?.email || user.email || null,
    license_number: prcLicense,
    prc_license_number: prcLicense,
    prc_expiry_date: profile?.prc_expiry_date || meta.prc_expiry_date || '2028-06-30',
    theme_preference: profile?.theme_preference || meta.theme_preference || 'light',
    notification_prefs: profile?.notification_prefs ||
      meta.notification_prefs || {
        critical_clinical: true,
        cold_chain: true,
        inventory_alerts: true,
        sound_alerts: false,
      },
    is_active: profile ? profile.is_active !== false : meta.is_active !== false,
  };

  if (resolvedProfile.is_active === false) {
    throw new AppError('Account is deactivated. Contact Central Admin.', 403);
  }

  const requestedBranchId = normalizeBranchId(
    req.headers['x-branch-id'] ||
      req.headers['x-branch-slug'] ||
      req.query?.branch_id ||
      req.body?.branch_id
  );

  if (role === 'doctor' || role === 'nurse') {
    if (!requestedBranchId || requestedBranchId !== assignedBranchId) {
      return res.status(403).json({
        success: false,
        error: 'Account is not authorized for this branch.',
        message:
          'This account is not assigned to this branch. Please switch to your assigned branch and try again.',
      });
    }
  }

  req.user = resolvedProfile;
  req.branchId =
    role === 'doctor' || role === 'nurse'
      ? assignedBranchId
      : requestedBranchId || null;
  req.accessToken = token;
  req.supabase = createUserSupabaseClient(token);
  return next();
});

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required.',
      message: 'Admin privileges required.',
    });
  }
  return next();
}

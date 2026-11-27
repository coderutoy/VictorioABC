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
    .select('id, branch_id, role, full_name, email, license_number, is_active, created_at')
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

  const resolvedProfile = {
    id: user.id,
    branch_id: assignedBranchId,
    role,
    full_name: profile?.full_name || meta.full_name || user.email || 'Victorio ABC User',
    email: profile?.email || user.email || null,
    license_number: profile?.license_number || meta.license_number || null,
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

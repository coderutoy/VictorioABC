import { supabaseAdmin, createUserSupabaseClient } from '../config/supabase.js';
import { AppError, asyncHandler } from './error.middleware.js';
import { normalizeBranchId } from '../modules/auth/auth.controller.js';

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
    .select('id, branch_id, role, full_name, email, license_number, is_active')
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

  // Enforce strict X-Branch-Id verification on branch-bound staff (doctor & nurse)
  const headerBranchId = normalizeBranchId(
    req.headers['x-branch-id'] || req.headers['x-branch-slug']
  );

  if (role === 'doctor' || role === 'nurse') {
    if (headerBranchId && headerBranchId !== assignedBranchId) {
      return res.status(403).json({
        success: false,
        error: 'Account is not authorized for this branch.',
        message: 'Account is not authorized for this branch.',
      });
    }
  }

  req.user = resolvedProfile;
  req.accessToken = token;
  req.supabase = createUserSupabaseClient(token);
  return next();
});

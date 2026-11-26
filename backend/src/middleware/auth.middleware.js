import { supabaseAdmin, createUserSupabaseClient } from '../config/supabase.js';
import { AppError, asyncHandler } from './error.middleware.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, branch_id, role, full_name, phone, email, license_number, notif_pref, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new AppError('User profile not provisioned.', 403);
  }

  if (!profile.is_active) {
    throw new AppError('Account is deactivated. Contact Central Admin.', 403);
  }

  req.user = profile;
  req.accessToken = token;
  req.supabase = createUserSupabaseClient(token);
  next();
});

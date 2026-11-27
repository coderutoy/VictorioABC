import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api } from '../lib/api';
import {
  BRANCH_STORAGE_KEY,
  DEFAULT_BRANCH_SLUG,
  getBranchBySlug,
} from '../config/branches';

export const ROLES = Object.freeze({
  PATIENT: 'patient',
  NURSE: 'nurse',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
});

export const STAFF_ROLES = [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN];

export const CROSS_BRANCH_DENIED_MESSAGE =
  'Access denied: Your account is assigned to a different branch and cannot sign in from this branch location.';

function verifyClientSideBranchMatch(profile, activeBranch) {
  if (!profile || !activeBranch) return;
  const role = String(profile.role || 'patient').toLowerCase();
  const assignedBranchId = profile.branch_id
    ? String(profile.branch_id).trim().toLowerCase()
    : null;
  const activeBranchId = activeBranch.id
    ? String(activeBranch.id).trim().toLowerCase()
    : null;

  const isSuperAdmin =
    Boolean(profile.super_admin) || (role === ROLES.ADMIN && !assignedBranchId);
  const isBranchBoundStaff =
    role === ROLES.DOCTOR ||
    role === ROLES.NURSE ||
    (role === ROLES.ADMIN && !isSuperAdmin);

  if (isBranchBoundStaff) {
    if (!assignedBranchId || !activeBranchId || assignedBranchId !== activeBranchId) {
      throw new Error(CROSS_BRANCH_DENIED_MESSAGE);
    }
  } else if (assignedBranchId && activeBranchId && assignedBranchId !== activeBranchId) {
    throw new Error(CROSS_BRANCH_DENIED_MESSAGE);
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const fetchProfile = useCallback(async (authUser) => {
    const userId = typeof authUser === 'string' ? authUser : authUser?.id;
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, branch_id, role, full_name, phone, email, license_number, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setAuthError(null);
      setProfile(data);
      return data;
    }

    // Fallback to signed Supabase Auth user_metadata if public.profiles table/row is not yet migrated
    const resolvedUser =
      typeof authUser === 'object' && authUser
        ? authUser
        : (await supabase.auth.getUser()).data?.user;

    if (resolvedUser) {
      const meta = resolvedUser.user_metadata || {};
      const fallbackProfile = {
        id: resolvedUser.id,
        branch_id: meta.branch_id || null,
        role: meta.role || 'patient',
        full_name: meta.full_name || resolvedUser.email || 'Victorio ABC User',
        phone: meta.phone || null,
        email: resolvedUser.email || null,
        license_number: meta.license_number || null,
        is_active: true,
      };
      setAuthError(null);
      setProfile(fallbackProfile);
      return fallbackProfile;
    }

    setAuthError(error?.message || 'Unable to load profile');
    setProfile(null);
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (initialSession?.user?.id) {
          const loadedProfile = await fetchProfile(initialSession.user);
          // Block patient role from holding an active web clinical dashboard session
          if (loadedProfile?.role === ROLES.PATIENT) {
            await supabase.auth.signOut();
            if (isMounted) {
              setSession(null);
              setProfile(null);
            }
          } else if (isMounted) {
            setSession(initialSession);
          }
        } else {
          setSession(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    if (!isSupabaseConfigured) return undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (nextSession?.user?.id) {
        const loadedProfile = await fetchProfile(nextSession.user);
        if (loadedProfile?.role === ROLES.PATIENT) {
          return;
        }
        setSession(nextSession);
      } else {
        setSession(null);
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email, password, activeBranchArg) => {
    setAuthError(null);

    const activeBranch =
      activeBranchArg ||
      getBranchBySlug(
        typeof window !== 'undefined'
          ? window.localStorage.getItem(BRANCH_STORAGE_KEY) || DEFAULT_BRANCH_SLUG
          : DEFAULT_BRANCH_SLUG
      );

    // 1. Primary path: authenticate via backend /api/v1/auth/login which enforces HTTP 403 branch lock
    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        branch_id: activeBranch?.id,
        branch_slug: activeBranch?.slug,
      });

      const payload = res.data?.data || {};
      const resolvedProfile = payload.profile;
      const resolvedRole = String(
        payload.role || resolvedProfile?.role || 'patient'
      ).toLowerCase();

      // Double-check branch match on the client as well
      verifyClientSideBranchMatch(resolvedProfile, activeBranch);

      // Patient role: do NOT establish a web clinical session; redirect to Mobile App Download screen
      if (resolvedRole === ROLES.PATIENT || payload.require_mobile_app) {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        return {
          role: ROLES.PATIENT,
          profile: resolvedProfile,
          requireMobileApp: true,
        };
      }

      if (payload.session?.access_token && payload.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: payload.session.access_token,
          refresh_token: payload.session.refresh_token,
        });
      }

      setSession(payload.session);
      setProfile(resolvedProfile);
      return {
        session: payload.session,
        user: payload.user,
        profile: resolvedProfile,
        role: resolvedRole,
        requireMobileApp: false,
      };
    } catch (err) {
      // If backend responded with an explicit HTTP status (e.g., 401 or 403 Forbidden), enforce it immediately
      if (err?.response) {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        const msg =
          err.response.data?.message ||
          (err.response.status === 403
            ? CROSS_BRANCH_DENIED_MESSAGE
            : 'Invalid email or password.');
        setAuthError(msg);
        const wrapped = new Error(msg);
        wrapped.status = err.response.status;
        throw wrapped;
      }

      // If it was already our client-side branch mismatch error, rethrow
      if (err?.message === CROSS_BRANCH_DENIED_MESSAGE) {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setAuthError(err.message);
        throw err;
      }
    }

    // 2. Fallback path if backend server is offline: authenticate with Supabase & enforce branch check
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      throw error;
    }

    const loadedProfile = await fetchProfile(data.user);

    try {
      verifyClientSideBranchMatch(loadedProfile, activeBranch);
    } catch (branchErr) {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setAuthError(branchErr.message);
      throw branchErr;
    }

    const resolvedRole = String(loadedProfile?.role || 'patient').toLowerCase();
    if (resolvedRole === ROLES.PATIENT) {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      return {
        role: ROLES.PATIENT,
        profile: loadedProfile,
        requireMobileApp: true,
      };
    }

    return {
      ...data,
      profile: loadedProfile,
      role: resolvedRole,
      requireMobileApp: false,
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    authError,
    isAuthenticated: Boolean(
      session &&
        profile &&
        profile.is_active &&
        STAFF_ROLES.includes(profile.role)
    ),
    isSupabaseConfigured,
    signIn,
    signOut,
    refreshProfile: () => fetchProfile(session?.user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}

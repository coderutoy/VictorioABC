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

export const ROLE_HOME_PATHS = Object.freeze({
  [ROLES.ADMIN]: '/dashboard/admin',
  [ROLES.NURSE]: '/dashboard/nurse',
  [ROLES.DOCTOR]: '/dashboard/doctor',
  [ROLES.PATIENT]: '/mobile-app-only',
});

/** Post-login landing route for each role (patients go to /mobile-app-only). */
export function getRoleHome(role) {
  return ROLE_HOME_PATHS[String(role || '').toLowerCase()] || '/login';
}

export const CROSS_BRANCH_DENIED_MESSAGE =
  'Access denied: Your account is assigned to a different branch and cannot sign in from this branch location.';

function normalizeBranchSlug(val) {
  if (!val) return null;
  return getBranchBySlug(val).slug;
}

function verifyClientSideBranchMatch(profile, activeBranch) {
  if (!profile || !activeBranch) return;
  const role = String(profile.role || 'patient').toLowerCase();
  const assignedSlug = profile.branch_id ? normalizeBranchSlug(profile.branch_id) : null;
  const activeSlug = normalizeBranchSlug(activeBranch.slug || activeBranch.id);

  const isSuperAdmin = Boolean(profile.super_admin);
  const isStaff =
    role === ROLES.DOCTOR ||
    role === ROLES.NURSE ||
    (role === ROLES.ADMIN && !isSuperAdmin);

  if (isStaff) {
    if (!assignedSlug || !activeSlug || assignedSlug !== activeSlug) {
      throw new Error(CROSS_BRANCH_DENIED_MESSAGE);
    }
  } else if (assignedSlug && activeSlug && assignedSlug !== activeSlug) {
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
      .select('id, email, full_name, role, branch_id, license_number, is_active, created_at')
      .eq('id', userId)
      .maybeSingle();

    const resolvedUser =
      typeof authUser === 'object' && authUser
        ? authUser
        : (await supabase.auth.getUser()).data?.user;
    const meta = resolvedUser?.user_metadata || {};

    if (!error && data) {
      const normalizedProfile = {
        ...data,
        branch_id: normalizeBranchSlug(data.branch_id || meta.branch_id) || DEFAULT_BRANCH_SLUG,
      };
      setAuthError(null);
      setProfile(normalizedProfile);
      return normalizedProfile;
    }

    if (resolvedUser) {
      const fallbackProfile = {
        id: resolvedUser.id,
        email: resolvedUser.email || null,
        full_name: meta.full_name || resolvedUser.email || 'Victorio ABC User',
        role: meta.role || 'patient',
        branch_id: normalizeBranchSlug(meta.branch_id) || DEFAULT_BRANCH_SLUG,
        license_number: meta.license_number || null,
        is_active: meta.is_active !== false,
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

    // 1. Authenticate directly against Supabase Auth with VITE_SUPABASE_ANON_KEY
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || '').trim(),
      password,
    });

    if (error || !data?.user) {
      const msg = error?.message || 'Invalid email or password. Please check your credentials.';
      setAuthError(msg);
      throw new Error(msg);
    }

    // 2. Load user profile from public.profiles (with signed user_metadata fallback)
    const loadedProfile = await fetchProfile(data.user);

    // 3. Enforce strict branch lock on the client AND verify with backend /api/v1/auth/verify-branch if reachable
    try {
      verifyClientSideBranchMatch(loadedProfile, activeBranch);
    } catch (branchErr) {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setAuthError(branchErr.message);
      const errObj = new Error(branchErr.message);
      errObj.status = 403;
      throw errObj;
    }

    try {
      await api.post('/auth/verify-branch', {
        branch_id: activeBranch.id,
        branch_slug: activeBranch.slug,
      });
    } catch (apiErr) {
      if (apiErr?.response?.status === 403) {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        const msg = apiErr.response.data?.message || CROSS_BRANCH_DENIED_MESSAGE;
        setAuthError(msg);
        const errObj = new Error(msg);
        errObj.status = 403;
        throw errObj;
      }
      // Ignore network/offline errors on verify-branch since client-side check already verified
    }

    const resolvedRole = String(loadedProfile?.role || 'patient').toLowerCase();

    // 4. Patient role: do NOT establish a web clinical session; route strictly to /mobile-app-only
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

    setSession(data.session);
    setProfile(loadedProfile);
    return {
      session: data.session,
      user: data.user,
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
        profile.is_active !== false &&
        STAFF_ROLES.includes(profile.role)
    ),
    isSupabaseConfigured,
    signIn,
    signOut,
    refreshProfile: () => fetchProfile(session?.user),
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

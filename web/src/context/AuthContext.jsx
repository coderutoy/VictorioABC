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
  'This account is not assigned to this branch. Please switch to your assigned branch and try again.';

function normalizeBranchSlug(val) {
  if (!val) return null;
  const cleaned = String(val).trim();
  if (!cleaned) return null;
  return getBranchBySlug(cleaned).slug;
}

/**
 * Passive database `branch_id` validation:
 * - `admin` & `patient`: unrestricted across all branches (`branch_id` may be NULL).
 * - `doctor` & `nurse` : strictly tied to their assigned `profile.branch_id`.
 */
export function verifyClientSideBranchMatch(profile, activeBranch) {
  if (!profile || !activeBranch) return;
  const role = String(profile.role || 'patient').toLowerCase();

  if (role === ROLES.ADMIN || role === ROLES.PATIENT) {
    return;
  }

  if (role === ROLES.DOCTOR || role === ROLES.NURSE) {
    const assignedSlug = normalizeBranchSlug(profile.branch_id);
    const activeSlug = normalizeBranchSlug(activeBranch.slug || activeBranch.id);
    if (!assignedSlug || !activeSlug || assignedSlug !== activeSlug) {
      throw new Error(CROSS_BRANCH_DENIED_MESSAGE);
    }
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
      const role = String(data.role || meta.role || 'patient').toLowerCase();
      const rawBranch = data.branch_id !== undefined ? data.branch_id : meta.branch_id;
      const normalizedProfile = {
        ...data,
        role,
        branch_id:
          role === ROLES.ADMIN || role === ROLES.PATIENT
            ? normalizeBranchSlug(rawBranch) || null
            : normalizeBranchSlug(rawBranch),
      };
      setAuthError(null);
      setProfile(normalizedProfile);
      return normalizedProfile;
    }

    if (resolvedUser) {
      const role = String(meta.role || 'patient').toLowerCase();
      const fallbackProfile = {
        id: resolvedUser.id,
        email: resolvedUser.email || null,
        full_name: meta.full_name || resolvedUser.email || 'Victorio ABC User',
        role,
        branch_id:
          role === ROLES.ADMIN || role === ROLES.PATIENT
            ? normalizeBranchSlug(meta.branch_id) || null
            : normalizeBranchSlug(meta.branch_id),
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
          const currentBranchSlug =
            typeof window !== 'undefined'
              ? getBranchBySlug(
                  window.localStorage.getItem(BRANCH_STORAGE_KEY) || DEFAULT_BRANCH_SLUG
                ).slug
              : DEFAULT_BRANCH_SLUG;

          const isStaffMismatch =
            (loadedProfile?.role === ROLES.DOCTOR ||
              loadedProfile?.role === ROLES.NURSE) &&
            loadedProfile?.branch_id !== currentBranchSlug;

          if (loadedProfile?.role === ROLES.PATIENT || isStaffMismatch) {
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

    // 1. Authenticate credentials via Supabase Auth (signInWithPassword)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || '').trim(),
      password,
    });

    if (error || !data?.user) {
      const msg = error?.message || 'Invalid email or password. Please check your credentials.';
      setAuthError(msg);
      throw new Error(msg);
    }

    // 2. Query profiles for the authenticated user's id to get role and branch_id
    const loadedProfile = await fetchProfile(data.user);
    const resolvedRole = String(loadedProfile?.role || 'patient').toLowerCase();

    // 3. If role === 'doctor' || role === 'nurse', passively compare profile.branch_id against activeBranch.id
    if (resolvedRole === ROLES.DOCTOR || resolvedRole === ROLES.NURSE) {
      try {
        verifyClientSideBranchMatch(loadedProfile, activeBranch);
      } catch (branchErr) {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setAuthError(CROSS_BRANCH_DENIED_MESSAGE);
        const errObj = new Error(CROSS_BRANCH_DENIED_MESSAGE);
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
          setAuthError(CROSS_BRANCH_DENIED_MESSAGE);
          const errObj = new Error(CROSS_BRANCH_DENIED_MESSAGE);
          errObj.status = 403;
          throw errObj;
        }
      }
    }

    // 4. If role === 'patient': skip branch restriction and navigate to /mobile-app-only
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

    // 5. If role === 'admin' (or branch-matched doctor/nurse): keep session active
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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

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

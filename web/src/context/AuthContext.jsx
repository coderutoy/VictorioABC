import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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

export const BRANCH_SWITCH_SIGNOUT_MESSAGE =
  'Signed out because you switched to a different branch.';

function normalizeBranchSlug(val) {
  if (!val) return null;
  const cleaned = String(val).trim();
  if (!cleaned) return null;
  return getBranchBySlug(cleaned).slug;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Prevents onAuthStateChange from prematurely authenticating or wiping authError during atomic signIn validation
  const validatingRef = useRef(false);

  const queryUserProfile = useCallback(async (authUser) => {
    const userId = typeof authUser === 'string' ? authUser : authUser?.id;
    if (!userId) return null;

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
      return {
        ...data,
        role,
        branch_id:
          role === ROLES.ADMIN || role === ROLES.PATIENT
            ? normalizeBranchSlug(rawBranch) || null
            : normalizeBranchSlug(rawBranch),
      };
    }

    if (resolvedUser && meta.role) {
      const role = String(meta.role).toLowerCase();
      return {
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
    }

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
          const loadedProfile = await queryUserProfile(initialSession.user);
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

          if (
            !loadedProfile ||
            loadedProfile.is_active === false ||
            loadedProfile.role === ROLES.PATIENT ||
            isStaffMismatch
          ) {
            await supabase.auth.signOut();
            if (isMounted) {
              setSession(null);
              setProfile(null);
            }
          } else if (isMounted) {
            setSession(initialSession);
            setProfile(loadedProfile);
          }
        } else {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    if (!isSupabaseConfigured) return undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      // Do NOT interfere while signIn() is performing atomic branch verification
      if (validatingRef.current) {
        return;
      }

      if (event === 'SIGNED_OUT' || !nextSession?.user?.id) {
        setSession(null);
        setProfile(null);
        // Never wipe authError on SIGNED_OUT so wrong-branch or branch-switch messages stay visible
        return;
      }

      const loadedProfile = await queryUserProfile(nextSession.user);
      if (!loadedProfile || loadedProfile.role === ROLES.PATIENT) {
        return;
      }

      const currentBranchSlug =
        typeof window !== 'undefined'
          ? getBranchBySlug(
              window.localStorage.getItem(BRANCH_STORAGE_KEY) || DEFAULT_BRANCH_SLUG
            ).slug
          : DEFAULT_BRANCH_SLUG;

      if (
        (loadedProfile.role === ROLES.DOCTOR || loadedProfile.role === ROLES.NURSE) &&
        loadedProfile.branch_id !== currentBranchSlug
      ) {
        return;
      }

      setSession(nextSession);
      setProfile(loadedProfile);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryUserProfile]);

  /**
   * Atomic sign-in with passive database `branch_id` validation:
   * - Sets validatingRef.current = true so onAuthStateChange never races or clears authError.
   * - Returns `{ ok: true, role, profile }` on success, or `{ ok: false, error }` on failure
   *   while also persisting `authError` in context.
   */
  const signIn = useCallback(
    async (email, password, activeBranchArg) => {
      validatingRef.current = true;
      setAuthError(null);

      try {
        const activeBranchObj =
          typeof activeBranchArg === 'string'
            ? getBranchBySlug(activeBranchArg)
            : activeBranchArg ||
              getBranchBySlug(
                typeof window !== 'undefined'
                  ? window.localStorage.getItem(BRANCH_STORAGE_KEY) || DEFAULT_BRANCH_SLUG
                  : DEFAULT_BRANCH_SLUG
              );
        const activeBranchId = activeBranchObj.slug || activeBranchObj.id;

        // 1. Authenticate credentials via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: String(email || '').trim(),
          password,
        });

        if (error || !data?.user) {
          const msg = 'Invalid email or password.';
          setAuthError(msg);
          return { ok: false, error: msg };
        }

        // 2. Query public.profiles for user.id
        const loadedProfile = await queryUserProfile(data.user);
        if (!loadedProfile || loadedProfile.is_active === false) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          const msg = 'Account profile is inactive or not configured.';
          setAuthError(msg);
          return { ok: false, error: msg };
        }

        const resolvedRole = String(loadedProfile.role || 'patient').toLowerCase();

        // 3. Strict branch check for doctor and nurse before setting authenticated state
        if (
          (resolvedRole === ROLES.DOCTOR || resolvedRole === ROLES.NURSE) &&
          loadedProfile.branch_id !== activeBranchId
        ) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          setAuthError(CROSS_BRANCH_DENIED_MESSAGE);
          return {
            ok: false,
            error: CROSS_BRANCH_DENIED_MESSAGE,
          };
        }

        // 4. Patient role: sign out web session and route to /mobile-app-only
        if (resolvedRole === ROLES.PATIENT) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          return {
            ok: true,
            role: ROLES.PATIENT,
            profile: loadedProfile,
            requireMobileApp: true,
          };
        }

        // 5. Validation passed for admin, doctor, or nurse
        setSession(data.session);
        setProfile(loadedProfile);
        return {
          ok: true,
          role: resolvedRole,
          profile: loadedProfile,
          session: data.session,
          user: data.user,
          requireMobileApp: false,
        };
      } finally {
        validatingRef.current = false;
      }
    },
    [queryUserProfile]
  );

  const signOut = useCallback(async (reasonMessage = null) => {
    validatingRef.current = true;
    try {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      if (typeof reasonMessage === 'string' && reasonMessage.trim()) {
        setAuthError(reasonMessage.trim());
      }
    } finally {
      validatingRef.current = false;
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    authError,
    setAuthError,
    clearAuthError,
    isAuthenticated: Boolean(
      session &&
        profile &&
        profile.is_active !== false &&
        STAFF_ROLES.includes(profile.role)
    ),
    isSupabaseConfigured,
    signIn,
    signOut,
    refreshProfile: async () => {
      if (!session?.user) return null;
      const p = await queryUserProfile(session.user);
      if (p) setProfile(p);
      return p;
    },
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

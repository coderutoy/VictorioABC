import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import api from '../lib/api';
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

export const THEME_STORAGE_KEY = 'victorio_abc_dashboard_theme';
export const NOTIF_PREFS_STORAGE_KEY = 'victorio_abc_notification_prefs';

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

const DEFAULT_NOTIF_PREFS = {
  critical_clinical: true,
  cold_chain: true,
  inventory_alerts: true,
  sound_alerts: false,
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [bufferMessage, setBufferMessage] = useState(null);

  const [dashboardTheme, setDashboardTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(NOTIF_PREFS_STORAGE_KEY);
        if (raw) return { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) };
      } catch {
        // ignore parse errors
      }
    }
    return DEFAULT_NOTIF_PREFS;
  });

  // Prevents onAuthStateChange from prematurely authenticating or wiping authError during atomic signIn validation
  const validatingRef = useRef(false);

  const runBuffer = useCallback(async (message, minMs = 550) => {
    setBufferMessage(message);
    await new Promise((resolve) => setTimeout(resolve, minMs));
    setBufferMessage(null);
  }, []);

  const queryUserProfile = useCallback(async (authUser) => {
    const userId = typeof authUser === 'string' ? authUser : authUser?.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
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
      const prcLicense =
        data.prc_license_number ||
        meta.prc_license_number ||
        data.license_number ||
        meta.license_number ||
        null;
      return {
        ...data,
        role,
        branch_id:
          role === ROLES.ADMIN || role === ROLES.PATIENT
            ? normalizeBranchSlug(rawBranch) || null
            : normalizeBranchSlug(rawBranch),
        license_number: prcLicense,
        prc_license_number: prcLicense,
        prc_expiry_date: data.prc_expiry_date || meta.prc_expiry_date || '2028-06-30',
        theme_preference: data.theme_preference || meta.theme_preference || 'light',
        notification_prefs:
          data.notification_prefs || meta.notification_prefs || DEFAULT_NOTIF_PREFS,
      };
    }

    if (resolvedUser && meta.role) {
      const role = String(meta.role).toLowerCase();
      const prcLicense = meta.prc_license_number || meta.license_number || null;
      return {
        id: resolvedUser.id,
        email: resolvedUser.email || null,
        full_name: meta.full_name || resolvedUser.email || 'Victorio ABC User',
        role,
        branch_id:
          role === ROLES.ADMIN || role === ROLES.PATIENT
            ? normalizeBranchSlug(meta.branch_id) || null
            : normalizeBranchSlug(meta.branch_id),
        license_number: prcLicense,
        prc_license_number: prcLicense,
        prc_expiry_date: meta.prc_expiry_date || '2028-06-30',
        theme_preference: meta.theme_preference || 'light',
        notification_prefs: meta.notification_prefs || DEFAULT_NOTIF_PREFS,
        is_active: meta.is_active !== false,
      };
    }

    return null;
  }, []);

  const syncProfilePreferencesToState = useCallback((loadedProfile) => {
    if (!loadedProfile) return;
    if (
      loadedProfile.theme_preference === 'dark' ||
      loadedProfile.theme_preference === 'light'
    ) {
      const savedLocal =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(THEME_STORAGE_KEY)
          : null;
      const resolvedTheme = savedLocal || loadedProfile.theme_preference;
      setDashboardTheme(resolvedTheme);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
      }
    }
    if (loadedProfile.notification_prefs) {
      const merged = { ...DEFAULT_NOTIF_PREFS, ...loadedProfile.notification_prefs };
      setNotificationPrefs(merged);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(NOTIF_PREFS_STORAGE_KEY, JSON.stringify(merged));
      }
    }
    // Lock storage branch to assigned branch for doctor/nurse
    if (
      (loadedProfile.role === ROLES.DOCTOR || loadedProfile.role === ROLES.NURSE) &&
      loadedProfile.branch_id &&
      typeof window !== 'undefined'
    ) {
      window.localStorage.setItem(BRANCH_STORAGE_KEY, loadedProfile.branch_id);
    }
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

          if (
            !loadedProfile ||
            loadedProfile.is_active === false ||
            loadedProfile.role === ROLES.PATIENT
          ) {
            await supabase.auth.signOut();
            if (isMounted) {
              setSession(null);
              setProfile(null);
            }
          } else if (isMounted) {
            syncProfilePreferencesToState(loadedProfile);
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
      if (validatingRef.current) {
        return;
      }

      if (event === 'SIGNED_OUT' || !nextSession?.user?.id) {
        setSession(null);
        setProfile(null);
        return;
      }

      const loadedProfile = await queryUserProfile(nextSession.user);
      if (!loadedProfile || loadedProfile.role === ROLES.PATIENT) {
        return;
      }

      syncProfilePreferencesToState(loadedProfile);
      setSession(nextSession);
      setProfile(loadedProfile);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryUserProfile, syncProfilePreferencesToState]);

  /**
   * Atomic sign-in with passive database `branch_id` validation and smooth clinical BufferLoader.
   */
  const signIn = useCallback(
    async (email, password, activeBranchArg) => {
      validatingRef.current = true;
      setAuthError(null);
      setBufferMessage('Verifying credentials & branch lock...');

      try {
        const startMs = Date.now();
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

        // Ensure ~550ms realistic clinical buffer display
        const elapsed = Date.now() - startMs;
        if (elapsed < 550) {
          await new Promise((r) => setTimeout(r, 550 - elapsed));
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
        syncProfilePreferencesToState(loadedProfile);
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
        setBufferMessage(null);
        validatingRef.current = false;
      }
    },
    [queryUserProfile, syncProfilePreferencesToState]
  );

  const signOut = useCallback(async (reasonMessage = null) => {
    validatingRef.current = true;
    setBufferMessage('Signing out of clinical workspace...');
    try {
      const startMs = Date.now();
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      const elapsed = Date.now() - startMs;
      if (elapsed < 550) {
        await new Promise((r) => setTimeout(r, 550 - elapsed));
      }
      setSession(null);
      setProfile(null);
      if (typeof reasonMessage === 'string' && reasonMessage.trim()) {
        setAuthError(reasonMessage.trim());
      } else {
        setAuthError(null);
      }
    } finally {
      setBufferMessage(null);
      validatingRef.current = false;
    }
  }, []);

  const updatePreferences = useCallback(
    async ({ theme_preference, notification_prefs }) => {
      if (theme_preference === 'dark' || theme_preference === 'light') {
        setDashboardTheme(theme_preference);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(THEME_STORAGE_KEY, theme_preference);
        }
      }
      if (notification_prefs) {
        setNotificationPrefs((prev) => {
          const next = { ...prev, ...notification_prefs };
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(NOTIF_PREFS_STORAGE_KEY, JSON.stringify(next));
          }
          return next;
        });
      }

      try {
        const res = await api.patch('/profile/preferences', {
          ...(theme_preference ? { theme_preference } : {}),
          ...(notification_prefs ? { notification_prefs } : {}),
        });
        if (res?.data?.profile) {
          setProfile((prev) => ({ ...prev, ...res.data.profile }));
        }
      } catch {
        // Local preference state is already updated
      }
    },
    []
  );

  const toggleDashboardTheme = useCallback(() => {
    const next = dashboardTheme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme_preference: next });
  }, [dashboardTheme, updatePreferences]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const role = profile?.role ? String(profile.role).toLowerCase() : null;
  const isAuthenticated = Boolean(session?.user && profile && role !== ROLES.PATIENT);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        role,
        loading,
        isAuthenticated,
        isSupabaseConfigured,
        authError,
        bufferMessage,
        runBuffer,
        dashboardTheme,
        isDark: dashboardTheme === 'dark',
        toggleDashboardTheme,
        notificationPrefs,
        updatePreferences,
        clearAuthError,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const ROLES = Object.freeze({
  PATIENT: 'patient',
  NURSE: 'nurse',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
});

export const STAFF_ROLES = [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN];

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
        setSession(initialSession);

        if (initialSession?.user?.id) {
          await fetchProfile(initialSession.user.id);
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
      setSession(nextSession);
      if (nextSession?.user?.id) {
        await fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    if (data.user?.id) {
      await fetchProfile(data.user.id);
    }
    return data;
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
    isAuthenticated: Boolean(session && profile && profile.is_active),
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

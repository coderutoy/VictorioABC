import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth, ROLES } from './AuthContext';
import {
  OFFICIAL_BRANCHES,
  DEFAULT_BRANCH_SLUG,
  BRANCH_STORAGE_KEY,
  getBranchBySlug,
} from '../config/branches';

const BranchContext = createContext(null);

function resolveInitialBranchSlug() {
  if (typeof window === 'undefined') return DEFAULT_BRANCH_SLUG;
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('branch');
    if (fromQuery) {
      const matched = getBranchBySlug(fromQuery);
      window.localStorage.setItem(BRANCH_STORAGE_KEY, matched.slug);
      return matched.slug;
    }
    const fromStorage = window.localStorage.getItem(BRANCH_STORAGE_KEY);
    if (fromStorage) {
      return getBranchBySlug(fromStorage).slug;
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_BRANCH_SLUG;
}

export function BranchProvider({ children }) {
  const { profile, role, isAuthenticated } = useAuth();
  const [branches, setBranches] = useState(OFFICIAL_BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBranchSlug, setSelectedBranchSlugState] = useState(resolveInitialBranchSlug);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const isGlobalAdmin = role === ROLES.ADMIN;

  // Sync URL ?branch=<slug> on initial load or popstate
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('branch');
      if (q) {
        const matched = getBranchBySlug(q);
        setSelectedBranchSlugState(matched.slug);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setSelectedBranchSlug = useCallback((slugOrId) => {
    const matched = getBranchBySlug(slugOrId);
    setSelectedBranchSlugState(matched.slug);
    setSelectedBranchId(matched.id);

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(BRANCH_STORAGE_KEY, matched.slug);
        const url = new URL(window.location.href);
        url.searchParams.set('branch', matched.slug);
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Ignore URL/storage errors
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadBranches() {
      if (!isAuthenticated || !isSupabaseConfigured) {
        setBranches(OFFICIAL_BRANCHES);
        return;
      }

      setLoadingBranches(true);
      try {
        let query = supabase
          .from('branches')
          .select('id, name, address, barangay, municipality, contact_number, status')
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (!isGlobalAdmin && profile?.branch_id) {
          query = query.eq('id', profile.branch_id);
        }

        const { data, error } = await query;
        if (!active) return;

        if (!error && Array.isArray(data) && data.length > 0) {
          setBranches(data);
          if (!isGlobalAdmin && profile?.branch_id) {
            setSelectedBranchId(profile.branch_id);
          } else if (isGlobalAdmin) {
            setSelectedBranchId((prev) => prev || '');
          }
        } else {
          setBranches(OFFICIAL_BRANCHES);
        }
      } catch {
        if (active) setBranches(OFFICIAL_BRANCHES);
      } finally {
        if (active) setLoadingBranches(false);
      }
    }

    loadBranches();
    return () => {
      active = false;
    };
  }, [isAuthenticated, isGlobalAdmin, profile?.branch_id]);

  const selectedPublicBranch = useMemo(
    () => getBranchBySlug(selectedBranchSlug),
    [selectedBranchSlug]
  );

  const activeBranchId = isAuthenticated
    ? isGlobalAdmin
      ? selectedBranchId || null
      : profile?.branch_id || selectedPublicBranch?.id || null
    : selectedPublicBranch?.id || null;

  const activeBranch = useMemo(
    () =>
      branches.find((b) => b.id === activeBranchId || b.slug === selectedBranchSlug) ||
      selectedPublicBranch,
    [branches, activeBranchId, selectedBranchSlug, selectedPublicBranch]
  );

  const setActiveBranchId = (branchId) => {
    if (!branchId) {
      setSelectedBranchId('');
      return;
    }
    setSelectedBranchId(branchId);
    const match = OFFICIAL_BRANCHES.find((b) => b.id === branchId || b.slug === branchId);
    if (match) {
      setSelectedBranchSlug(match.slug);
    }
  };

  const value = {
    branches,
    publicBranches: OFFICIAL_BRANCHES,
    selectedBranchSlug,
    selectedPublicBranch,
    setSelectedBranchSlug,
    activeBranchId,
    activeBranch,
    canSwitchBranch: !isAuthenticated || isGlobalAdmin,
    loadingBranches,
    setActiveBranchId,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) {
    throw new Error('useBranch must be used inside a BranchProvider');
  }
  return ctx;
}

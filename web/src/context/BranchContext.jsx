import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth, ROLES } from './AuthContext';
import {
  OFFICIAL_BRANCHES,
  DEFAULT_BRANCH_SLUG,
  BRANCH_STORAGE_KEY,
  BRANCH_MANUAL_OVERRIDE_KEY,
  getBranchBySlug,
  findNearestOfficialBranch,
} from '../config/branches';

const BranchContext = createContext(null);

function resolveInitialBranchState() {
  if (typeof window === 'undefined') {
    return { slug: DEFAULT_BRANCH_SLUG, hasManualSelection: false };
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('branch');
    if (fromQuery) {
      const matched = getBranchBySlug(fromQuery);
      window.localStorage.setItem(BRANCH_STORAGE_KEY, matched.slug);
      return { slug: matched.slug, hasManualSelection: true };
    }
    const isManual = window.sessionStorage.getItem(BRANCH_MANUAL_OVERRIDE_KEY) === 'true';
    const fromStorage = window.localStorage.getItem(BRANCH_STORAGE_KEY);
    if (fromStorage) {
      return { slug: getBranchBySlug(fromStorage).slug, hasManualSelection: isManual };
    }
  } catch {
    // Ignore storage errors
  }
  return { slug: DEFAULT_BRANCH_SLUG, hasManualSelection: false };
}

export function BranchProvider({ children }) {
  const { profile, role, isAuthenticated } = useAuth();
  const [branches, setBranches] = useState(OFFICIAL_BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [initialState] = useState(resolveInitialBranchState);
  const [selectedBranchSlug, setSelectedBranchSlugState] = useState(initialState.slug);
  const [hasManualSelection, setHasManualSelection] = useState(
    initialState.hasManualSelection
  );
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Geolocation state
  const [geolocationStatus, setGeolocationStatus] = useState('idle'); // 'idle' | 'detecting' | 'detected' | 'denied' | 'unavailable'
  const [nearestBranchSlug, setNearestBranchSlug] = useState(null);
  const [distancesBySlug, setDistancesBySlug] = useState({});

  const isGlobalAdmin = role === ROLES.ADMIN;

  const persistBranchSlug = useCallback((slug, markManual = false) => {
    const matched = getBranchBySlug(slug);
    setSelectedBranchSlugState(matched.slug);
    setSelectedBranchId(matched.id);
    if (markManual) {
      setHasManualSelection(true);
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(BRANCH_STORAGE_KEY, matched.slug);
        if (markManual) {
          window.sessionStorage.setItem(BRANCH_MANUAL_OVERRIDE_KEY, 'true');
        }
        const url = new URL(window.location.href);
        url.searchParams.set('branch', matched.slug);
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Ignore URL/storage errors
      }
    }
  }, []);

  const setSelectedBranchSlug = useCallback(
    (slugOrId) => {
      persistBranchSlug(slugOrId, true);
    },
    [persistBranchSlug]
  );

  // Trigger device geolocation and optionally auto-switch to the nearest of the 7 branches
  const detectNearestBranch = useCallback(
    ({ autoSelect = true } = {}) => {
      if (typeof window === 'undefined' || !navigator?.geolocation) {
        setGeolocationStatus('unavailable');
        return;
      }

      setGeolocationStatus('detecting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const result = findNearestOfficialBranch(latitude, longitude);
          if (result?.branch) {
            setNearestBranchSlug(result.branch.slug);
            setDistancesBySlug(result.distancesBySlug || {});
            setGeolocationStatus('detected');
            if (autoSelect) {
              persistBranchSlug(result.branch.slug, false);
            }
          } else {
            setGeolocationStatus('unavailable');
          }
        },
        () => {
          setGeolocationStatus('denied');
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 300000,
        }
      );
    },
    [persistBranchSlug]
  );

  // Automatic Nearest-Branch Detection on initial load when user has not manually selected a branch
  useEffect(() => {
    detectNearestBranch({ autoSelect: !hasManualSelection });
  }, [detectNearestBranch, hasManualSelection]);

  // Sync URL ?branch=<slug> on popstate
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

  const selectedBranchDistanceKm = useMemo(() => {
    const dist = distancesBySlug[selectedPublicBranch.slug];
    return typeof dist === 'number' ? dist : null;
  }, [distancesBySlug, selectedPublicBranch.slug]);

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
    geolocationStatus,
    nearestBranchSlug,
    distancesBySlug,
    selectedBranchDistanceKm,
    isNearestBranchSelected:
      Boolean(nearestBranchSlug) && nearestBranchSlug === selectedPublicBranch.slug,
    detectNearestBranch: () => detectNearestBranch({ autoSelect: true }),
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

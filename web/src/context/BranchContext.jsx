import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  OFFICIAL_BRANCHES,
  DEFAULT_BRANCH_SLUG,
  BRANCH_STORAGE_KEY,
  BRANCH_MANUAL_OVERRIDE_KEY,
  getBranchBySlug,
  findNearestOfficialBranch,
  buildMapsUrl,
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
  const { profile, isAuthenticated } = useAuth();
  const [branches, setBranches] = useState(OFFICIAL_BRANCHES);
  const [initialState] = useState(resolveInitialBranchState);
  const [selectedBranchSlug, setSelectedBranchSlugState] = useState(initialState.slug);
  const [hasManualSelection, setHasManualSelection] = useState(
    initialState.hasManualSelection
  );
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Geolocation state
  const [geolocationStatus, setGeolocationStatus] = useState('idle');
  const [nearestBranchSlug, setNearestBranchSlug] = useState(null);
  const [distancesBySlug, setDistancesBySlug] = useState({});

  const persistBranchSlug = useCallback((slug, markManual = false) => {
    const matched = getBranchBySlug(slug);
    setSelectedBranchSlugState(matched.slug);
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

  useEffect(() => {
    detectNearestBranch({ autoSelect: !hasManualSelection });
  }, [detectNearestBranch, hasManualSelection]);

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

  // Load branches from public.branches table in Supabase and enrich with official config metadata
  useEffect(() => {
    let active = true;

    async function loadBranches() {
      if (!isSupabaseConfigured) {
        setBranches(OFFICIAL_BRANCHES);
        return;
      }

      setLoadingBranches(true);
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('id, name, address, maps_query, phone, lat, lng, is_active')
          .eq('is_active', true);

        if (!active) return;

        if (!error && Array.isArray(data) && data.length > 0) {
          const merged = OFFICIAL_BRANCHES.map((official) => {
            const dbRow = data.find((r) => r.id === official.slug);
            if (!dbRow) return official;
            return {
              ...official,
              name: dbRow.name || official.name,
              address: dbRow.address || official.address,
              mapsQuery: dbRow.maps_query || official.mapsQuery,
              mapsUrl: buildMapsUrl(dbRow.maps_query || official.mapsQuery),
              phone: dbRow.phone || official.phone,
              contactNumber: dbRow.phone || official.contactNumber,
              lat: typeof dbRow.lat === 'number' ? dbRow.lat : official.lat,
              lng: typeof dbRow.lng === 'number' ? dbRow.lng : official.lng,
            };
          });
          setBranches(merged);
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
  }, [isAuthenticated]);

  const selectedPublicBranch = useMemo(
    () => getBranchBySlug(selectedBranchSlug),
    [selectedBranchSlug]
  );

  const selectedBranchDistanceKm = useMemo(() => {
    const dist = distancesBySlug[selectedPublicBranch.slug];
    return typeof dist === 'number' ? dist : null;
  }, [distancesBySlug, selectedPublicBranch.slug]);

  const assignedBranchSlug = profile?.branch_id
    ? getBranchBySlug(profile.branch_id).slug
    : null;

  const activeBranchId = isAuthenticated
    ? assignedBranchSlug || selectedPublicBranch.id
    : selectedPublicBranch.id;

  const activeBranch = useMemo(
    () => getBranchBySlug(activeBranchId),
    [activeBranchId]
  );

  const setActiveBranchId = (branchIdOrSlug) => {
    if (!branchIdOrSlug) return;
    setSelectedBranchSlug(branchIdOrSlug);
  };

  const value = {
    branches,
    publicBranches: OFFICIAL_BRANCHES,
    selectedBranchSlug,
    selectedPublicBranch,
    setSelectedBranchSlug,
    activeBranchId,
    activeBranch,
    canSwitchBranch: !isAuthenticated,
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

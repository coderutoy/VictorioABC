import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth, ROLES } from './AuthContext';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const { profile, role, isAuthenticated } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loadingBranches, setLoadingBranches] = useState(false);

  const isGlobalAdmin = role === ROLES.ADMIN;

  useEffect(() => {
    let active = true;

    async function loadBranches() {
      if (!isAuthenticated || !isSupabaseConfigured) {
        setBranches([]);
        setSelectedBranchId('');
        return;
      }

      setLoadingBranches(true);
      try {
        let query = supabase
          .from('branches')
          .select('id, code, name, address, contact_number, is_active')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (!isGlobalAdmin && profile?.branch_id) {
          query = query.eq('id', profile.branch_id);
        }

        const { data, error } = await query;
        if (!active) return;

        if (!error && data) {
          setBranches(data);
          if (!isGlobalAdmin && profile?.branch_id) {
            setSelectedBranchId(profile.branch_id);
          } else if (isGlobalAdmin) {
            // Empty string represents "All Branches (HQ)" for Central Admin
            setSelectedBranchId((prev) => prev || '');
          }
        }
      } finally {
        if (active) setLoadingBranches(false);
      }
    }

    loadBranches();
    return () => {
      active = false;
    };
  }, [isAuthenticated, isGlobalAdmin, profile?.branch_id]);

  const activeBranchId = isGlobalAdmin ? selectedBranchId || null : profile?.branch_id || null;

  const activeBranch = useMemo(
    () => branches.find((b) => b.id === activeBranchId) || null,
    [branches, activeBranchId]
  );

  const setActiveBranchId = (branchId) => {
    if (!isGlobalAdmin) return;
    setSelectedBranchId(branchId || '');
  };

  const value = {
    branches,
    activeBranchId,
    activeBranch,
    canSwitchBranch: isGlobalAdmin,
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

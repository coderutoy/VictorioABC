import { Menu, Building2, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function Header({ onOpenSidebar }) {
  const { profile, role, signOut } = useAuth();
  const { branches, activeBranchId, activeBranch, canSwitchBranch, setActiveBranchId } = useBranch();

  const roleTone = {
    admin: 'blue',
    doctor: 'emerald',
    nurse: 'teal',
  }[role] || 'slate';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[#DDDCD4] bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="min-h-[44px] min-w-[44px] rounded-xl p-2 text-[#464B71] hover:bg-[#F2F2ED] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#118AB2]" />
          {canSwitchBranch ? (
            <select
              aria-label="Select branch scope"
              value={activeBranchId || ''}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="min-h-[40px] rounded-xl border border-[#DDDCD4] bg-white px-3 py-1.5 text-xs font-semibold text-[#464B71] focus:border-[#118AB2] focus:outline-none focus:ring-2 focus:ring-[#7CD5C7]/40"
            >
              <option value="">All Branches (HQ View)</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} (Brgy. {branch.barangay})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-semibold text-[#464B71]">
              {activeBranch ? `${activeBranch.name} (Brgy. ${activeBranch.barangay})` : 'Assigned Branch'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold text-[#464B71]">
            {profile?.full_name || 'Clinical Staff'}
          </p>
          <div className="flex items-center justify-end gap-1.5">
            <Badge tone={roleTone}>{role ? role.toUpperCase() : 'STAFF'}</Badge>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}

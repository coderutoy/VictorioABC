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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-brand-600" />
          {canSwitchBranch ? (
            <select
              aria-label="Select branch scope"
              value={activeBranchId || ''}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All Branches (HQ View)</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-medium text-slate-700">
              {activeBranch ? `${activeBranch.name} (${activeBranch.code})` : 'Assigned Branch'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">
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

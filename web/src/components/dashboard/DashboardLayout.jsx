import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ScanLine,
  Stethoscope,
  CalendarClock,
  Syringe,
  BarChart3,
  Building2,
  ShieldCheck,
  Globe,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';

const NAV_BY_ROLE = {
  [ROLES.ADMIN]: [
    { to: '/dashboard/admin', label: 'Admin Overview', icon: LayoutDashboard },
    { to: '/patients', label: 'Patient Registry', icon: Users },
    { to: '/inventory', label: 'Vaccine Inventory', icon: Syringe },
    { to: '/analytics', label: 'HQ Analytics', icon: BarChart3 },
    { to: '/branches', label: 'Branches', icon: Building2 },
    { to: '/audit', label: 'Audit Logs', icon: ShieldCheck },
  ],
  [ROLES.NURSE]: [
    { to: '/dashboard/nurse', label: 'Nurse Workspace', icon: LayoutDashboard },
    { to: '/triage', label: 'QR & Triage Queue', icon: ScanLine },
    { to: '/patients', label: 'Patient Registry', icon: Users },
    { to: '/schedules', label: 'PEP Schedules', icon: CalendarClock },
    { to: '/inventory', label: 'Vaccine Inventory', icon: Syringe },
  ],
  [ROLES.DOCTOR]: [
    { to: '/dashboard/doctor', label: 'Doctor Workspace', icon: LayoutDashboard },
    { to: '/clinical-orders', label: 'Clinical Orders', icon: Stethoscope },
    { to: '/triage', label: 'Triage Queue', icon: ScanLine },
    { to: '/patients', label: 'Patient Registry', icon: Users },
    { to: '/schedules', label: 'PEP Schedules', icon: CalendarClock },
  ],
};

const ROLE_BADGE = {
  [ROLES.ADMIN]: 'bg-[#118AB2] text-white',
  [ROLES.DOCTOR]: 'bg-emerald-600 text-white',
  [ROLES.NURSE]: 'bg-[#7CD5C7] text-[#464B71]',
};

/**
 * Shared clinical dashboard shell: collapsible slide-over sidebar on < lg, top bar with
 * user name, role badge, active branch and Sign Out.
 */
export function DashboardLayout() {
  const { profile, role, signOut } = useAuth();
  const { branches, activeBranchId, activeBranch, canSwitchBranch, setActiveBranchId } = useBranch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = NAV_BY_ROLE[role] || [];
  const branchName = activeBranch?.name || (canSwitchBranch ? 'All Branches (HQ View)' : 'Assigned Branch');

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen overflow-x-clip bg-[#F2F2ED] text-[#464B71]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#343857]/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Dashboard navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 max-w-[85vw] flex-col border-r border-[#343857] bg-[#464B71] text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/15 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/victorio_logo.jpg"
              alt="Victorio ABC Logo"
              className="h-10 w-10 rounded-full border-2 border-[#7CD5C7] bg-white object-cover"
            />
            <div>
              <p className="text-sm font-bold leading-tight">Victorio ABC</p>
              <p className="text-[11px] font-medium capitalize text-[#7CD5C7]">{role} workspace</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#118AB2] text-white shadow-sm'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/15 p-3">
          <Link
            to="/"
            className="flex min-h-[44px] items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-[#7CD5C7] transition hover:bg-white/15"
          >
            <Globe className="h-4 w-4" />
            <span>View Public Website</span>
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[#DDDCD4] bg-white px-3 py-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#464B71] hover:bg-[#F2F2ED] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            {canSwitchBranch ? (
              <select
                aria-label="Select branch scope"
                value={activeBranchId || ''}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="min-h-[44px] max-w-[11rem] rounded-xl border border-[#DDDCD4] bg-white px-2.5 py-1.5 text-xs font-bold text-[#464B71] focus:border-[#118AB2] focus:outline-none focus:ring-2 focus:ring-[#7CD5C7]/50 sm:max-w-xs"
              >
                <option value="">All Branches (HQ View)</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.shortName || branch.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-extrabold text-[#464B71] sm:text-sm">
                <Building2 className="h-4 w-4 shrink-0 text-[#118AB2]" />
                <span className="truncate">{branchName}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="max-w-[12rem] truncate text-sm font-extrabold text-[#464B71]">
                {profile?.full_name || 'Clinical Staff'}
              </p>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  ROLE_BADGE[role] || 'bg-[#464B71] text-white'
                }`}
              >
                {role || 'staff'}
              </span>
            </div>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase sm:hidden ${
                ROLE_BADGE[role] || 'bg-[#464B71] text-white'
              }`}
            >
              {role || 'staff'}
            </span>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3 py-2 text-xs font-extrabold text-[#464B71] transition hover:bg-[#DDDCD4]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-6">
          <Outlet />
        </main>

        <footer className="border-t border-[#DDDCD4] bg-white px-4 py-3 text-center text-[11px] text-[#464B71]/70">
          Victorio Animal Bite Center • Clinical EMR • Protected under RA 10173
        </footer>
      </div>
    </div>
  );
}

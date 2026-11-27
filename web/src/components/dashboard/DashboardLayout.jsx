import { useEffect, useRef, useState } from 'react';
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
  ChevronDown,
  Check,
  LocateFixed,
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { formatBranchLabel } from '../../config/branches';

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
 * Shared clinical dashboard shell:
 * - Minimal logo-adjacent branch dropdown trigger directly beside the Victorio ABC logo
 *   with active branch text underneath (e.g., "Santa Maria Branch").
 * - Selecting another branch as Admin dynamically reloads branch data; selecting another
 *   branch as Doctor/Nurse immediately terminates the session and redirects to /login.
 */
export function DashboardLayout() {
  const { profile, role, signOut } = useAuth();
  const {
    publicBranches,
    selectedPublicBranch,
    setSelectedBranchSlug,
    detectNearestBranch,
  } = useBranch();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const branchMenuRef = useRef(null);

  const navItems = NAV_BY_ROLE[role] || [];
  const branchSubtext =
    selectedPublicBranch?.branchLabel || formatBranchLabel(selectedPublicBranch);

  useEffect(() => {
    function handleOutside(e) {
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target)) {
        setBranchMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSelectBranch = (slug) => {
    setSelectedBranchSlug(slug);
    setBranchMenuOpen(false);
  };

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
        {/* Logo + Borderless Branch Dropdown Trigger Beside Logo + Branch Name Text Underneath */}
        <div
          ref={branchMenuRef}
          className="relative flex shrink-0 flex-col border-b border-white/15 px-4 py-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2.5">
                <img
                  src="/victorio_logo.jpg"
                  alt="Victorio ABC Logo"
                  className="h-10 w-10 rounded-full border-2 border-[#7CD5C7] bg-white object-cover"
                />
                <div>
                  <p className="text-sm font-extrabold leading-tight text-white">
                    Victorio ABC
                  </p>
                  <p className="text-[11px] font-semibold capitalize text-[#7CD5C7]">
                    {role} workspace
                  </p>
                </div>
              </Link>

              <button
                type="button"
                data-testid="dashboard-branch-switcher-trigger"
                onClick={() => setBranchMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={branchMenuOpen}
                aria-label={`Switch branch (current: ${branchSubtext})`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#7CD5C7] transition hover:bg-white/10 hover:text-white"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    branchMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            data-testid="dashboard-logo-branch-subtext"
            onClick={() => setBranchMenuOpen((prev) => !prev)}
            className="mt-1 pl-0.5 text-left text-[11px] font-medium text-white/80 transition hover:text-[#7CD5C7]"
          >
            {branchSubtext}
          </button>

          {branchMenuOpen && (
            <div
              role="menu"
              aria-label="Select Clinic Branch"
              className="absolute left-3 top-full z-50 mt-1.5 w-60 rounded-2xl border border-[#DDDCD4] bg-white p-1.5 text-[#464B71] shadow-2xl"
            >
              <div className="max-h-64 space-y-0.5 overflow-y-auto">
                {publicBranches.map((branch) => {
                  const isSelected = branch.slug === selectedPublicBranch.slug;
                  return (
                    <button
                      key={branch.slug}
                      type="button"
                      role="menuitem"
                      onClick={() => handleSelectBranch(branch.slug)}
                      className={`flex min-h-[40px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition ${
                        isSelected
                          ? 'bg-[#7CD5C7]/25 font-extrabold text-[#464B71]'
                          : 'text-[#464B71]/90 hover:bg-[#F2F2ED]'
                      }`}
                    >
                      <span className="truncate">{branch.shortName}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-[#118AB2]" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1 border-t border-[#F2F2ED] pt-1">
                <button
                  type="button"
                  onClick={() => {
                    detectNearestBranch();
                    setBranchMenuOpen(false);
                  }}
                  className="flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#118AB2] hover:bg-[#EAFBF8]"
                >
                  <LocateFixed className="h-3.5 w-3.5" />
                  <span>Detect nearest branch</span>
                </button>
              </div>
            </div>
          )}
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

            <span className="text-xs font-extrabold text-[#464B71] sm:text-sm">
              {branchSubtext}
            </span>
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

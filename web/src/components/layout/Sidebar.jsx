import { NavLink, Link } from 'react-router-dom';
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
  X,
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Clinical Overview', icon: LayoutDashboard, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
  { to: '/patients', label: 'Patient Registry', icon: Users, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
  { to: '/triage', label: 'QR & Triage Queue', icon: ScanLine, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
  { to: '/clinical-orders', label: 'Doctor Clinical Orders', icon: Stethoscope, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
  { to: '/schedules', label: 'PEP Schedules', icon: CalendarClock, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
  { to: '/inventory', label: 'Vaccine Inventory', icon: Syringe, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
  { to: '/analytics', label: 'HQ Analytics', icon: BarChart3, roles: [ROLES.ADMIN] },
  { to: '/branches', label: 'Branches', icon: Building2, roles: [ROLES.ADMIN] },
  { to: '/audit', label: 'Audit Logs', icon: ShieldCheck, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
];

export function Sidebar({ isOpen, onClose }) {
  const { role } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#464B71]/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#343857] bg-[#464B71] text-white transition-transform lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/15 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/victorio_logo.jpg"
              alt="Victorio ABC Logo"
              className="h-10 w-10 rounded-full border-2 border-[#7CD5C7] bg-white object-cover"
            />
            <div>
              <p className="text-sm font-bold leading-tight text-white">Victorio ABC</p>
              <p className="text-[11px] font-medium text-[#7CD5C7]">Clinical EMR Portal</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
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
            className="flex min-h-[42px] items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-[#7CD5C7] transition hover:bg-white/15"
          >
            <Globe className="h-4 w-4" />
            <span>View Public Website</span>
          </Link>
          <p className="px-1 text-[11px] text-white/70">
            San Jose del Monte • WHO Rabies PEP
          </p>
        </div>
      </aside>
    </>
  );
}

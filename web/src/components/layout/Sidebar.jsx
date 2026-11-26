import { NavLink } from 'react-router-dom';
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
  X,
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
  { to: '/patients', label: 'Patients', icon: Users, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
  { to: '/triage', label: 'AI Triage Queue', icon: ScanLine, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
  { to: '/clinical-orders', label: 'Clinical Orders', icon: Stethoscope, roles: [ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN] },
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
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
              VA
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-900">Victorio ABC</p>
              <p className="text-[11px] font-medium text-slate-500">Clinical Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
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
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
          WHO Rabies PEP & Multi-Branch EMR
        </div>
      </aside>
    </>
  );
}

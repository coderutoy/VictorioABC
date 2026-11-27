import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  FileCheck2,
  ScanEye,
  Calculator,
  AlertTriangle,
  Users,
  Syringe,
  ThermometerSnowflake,
  Bell,
  Sun,
  Moon,
  Settings,
  LogOut,
  Menu,
  X,
  Lock,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  Award,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Save,
} from 'lucide-react';
import { useAuth, ROLES, getRoleHome } from '../../context/AuthContext';
import { getBranchBySlug, formatBranchLabel } from '../../config/branches';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';
import { BufferLoader } from '../ui/BufferLoader';

/**
 * Phase 2.3.1 Decluttered Sidebar Navigation (4–5 Focused Views per Role):
 * - Admin (Owner): Overview & 7-Branch Matrix, Inventory & Transfers, Staff & PRC, Audit Log, Settings
 * - Doctor (Branch-Locked): AI Triage Queue, Patient Dosing & Sign-Off, High-Risk & AEFI, Settings
 * - Nurse (Branch-Locked): Triage & Boosters, Open-Vial & FEFO, Cold-Chain & Defaulters, Settings
 */
const ROLE_MODULES = {
  [ROLES.ADMIN]: [
    {
      tab: 'matrix',
      label: 'Overview & 7-Branch Matrix',
      icon: Building2,
      subtitle: 'Network KPIs, daily sales & 7-branch drill-down',
    },
    {
      tab: 'inventory',
      label: 'Inventory & Transfers',
      icon: TrendingUp,
      subtitle: '14-day stockout rebalance & multi-dose vial yield',
    },
    {
      tab: 'staff',
      label: 'Staff & PRC',
      icon: ShieldCheck,
      subtitle: 'Branch assignments & PRC credential expiration',
    },
    {
      tab: 'audit',
      label: 'Audit Log',
      icon: FileCheck2,
      subtitle: 'Immutable ledger of clinical & stock actions',
    },
    {
      tab: 'settings',
      label: 'Settings',
      icon: Settings,
      subtitle: 'Theme, profile credentials & alert preferences',
    },
  ],
  [ROLES.DOCTOR]: [
    {
      tab: 'ai_queue',
      label: 'AI Triage Queue',
      icon: ScanEye,
      subtitle: 'Human-in-the-loop wound photo verification',
    },
    {
      tab: 'dosing',
      label: 'Patient Dosing & Sign-Off',
      icon: Calculator,
      subtitle: 'Weight ERIG/HRIG calculator & PRC ABTP stamp',
    },
    {
      tab: 'cat3',
      label: 'High-Risk & AEFI',
      icon: AlertTriangle,
      subtitle: 'Category III surveillance & AEFI reporting',
    },
    {
      tab: 'settings',
      label: 'Settings',
      icon: Settings,
      subtitle: 'Theme, PRC credentials & password security',
    },
  ],
  [ROLES.NURSE]: [
    {
      tab: 'triage',
      label: 'Triage & Boosters',
      icon: Users,
      subtitle: 'Walk-in intake & scheduled Day 3/7/14/28 doses',
    },
    {
      tab: 'fefo',
      label: 'Open-Vial & FEFO',
      icon: Syringe,
      subtitle: '6-hour vial countdown & FEFO batch dose logger',
    },
    {
      tab: 'defaulters',
      label: 'Cold-Chain & Defaulters',
      icon: ThermometerSnowflake,
      subtitle: '2.0°C–8.0°C shift log & Cat III callback queue',
    },
    {
      tab: 'settings',
      label: 'Settings',
      icon: Settings,
      subtitle: 'Theme, PRC credentials & alert preferences',
    },
  ],
};

function WorkspaceSettingsView({
  profile,
  role,
  branchLabel,
  isDark,
  updatePreferences,
  notificationPrefs,
}) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [prcNumber, setPrcNumber] = useState(profile?.prc_license_number || '');
  const [prcExpiry, setPrcExpiry] = useState(profile?.prc_expiry_date || '2028-06-30');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ type: '', text: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSavedNotice, setPrefsSavedNotice] = useState(false);

  const handleSaveProfileCredentials = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.patch('/profile/preferences', {
        full_name: fullName,
        prc_license_number: prcNumber,
        prc_expiry_date: prcExpiry,
      });
      setProfileMsg({
        type: 'success',
        text: 'Profile & PRC credentials saved to Supabase.',
      });
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err?.userMessage || err?.message || 'Failed to update profile credentials.',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleToggleNotifPref = async (key) => {
    setPrefsSaving(true);
    setPrefsSavedNotice(false);
    try {
      const nextPrefs = {
        ...notificationPrefs,
        [key]: !notificationPrefs[key],
      };
      await updatePreferences({ notification_prefs: nextPrefs });
      setPrefsSavedNotice(true);
      setTimeout(() => setPrefsSavedNotice(false), 2200);
    } finally {
      setPrefsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', text: '' });

    if (!newPassword || newPassword.length < 8) {
      setPasswordStatus({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordStatus({ type: 'error', text: error.message });
      } else {
        setPasswordStatus({
          type: 'success',
          text: 'Password updated cleanly in Supabase Auth.',
        });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        text: err?.message || 'Failed to update password.',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
        <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#118AB2]">
          Workspace Settings &amp; Security
        </span>
        <h1 className="mt-1.5 text-2xl font-extrabold">
          Clinical Profile, Theme &amp; Notification Preferences
        </h1>
        <p className="mt-1 text-xs opacity-75">
          All preferences persist directly to your Supabase profile and local workspace session.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. Theme & Notification Preferences */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold">1. Workspace Appearance</h2>
            <p className="mt-0.5 text-xs opacity-75">
              Applies high-contrast slate-navy dark mode to your clinical workspace while keeping the public website in its default light theme.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updatePreferences({ theme_preference: 'light' })}
                className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-xs font-extrabold transition ${
                  !isDark
                    ? 'border-[#118AB2] bg-[#118AB2]/10 text-[#464B71]'
                    : 'border-slate-700 bg-slate-800/60 text-slate-300'
                }`}
              >
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Clinical Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => updatePreferences({ theme_preference: 'dark' })}
                className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-xs font-extrabold transition ${
                  isDark
                    ? 'border-[#7CD5C7] bg-[#0F172A] text-[#7CD5C7]'
                    : 'border-[#DDDCD4] bg-[#F2F2ED] text-[#464B71]'
                }`}
              >
                <Moon className="h-4 w-4 text-[#118AB2]" />
                <span>Slate-Navy Dark Mode</span>
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold">
                2. Real-Time Clinical Alert Toggles
              </h2>
              {prefsSavedNotice && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Saved to Supabase</span>
                </span>
              )}
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                {
                  key: 'critical_clinical',
                  label: 'High-Risk Cat III AI Uploads & Overdue Boosters',
                },
                {
                  key: 'cold_chain',
                  label: 'Cold-Chain Temperature Breach Escalations (2.0°C–8.0°C)',
                },
                {
                  key: 'inventory_alerts',
                  label: '6-Hr Open-Vial Expiry & 14-Day Stockout Warnings',
                },
                {
                  key: 'sound_alerts',
                  label: 'Visual & Audible Priority Chime on Critical Alerts',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-4 py-3 text-xs font-bold"
                >
                  <span className="flex items-center gap-2.5 pr-2">
                    <Volume2 className="h-4 w-4 shrink-0 text-[#118AB2]" />
                    <span>{item.label}</span>
                  </span>
                  <input
                    type="checkbox"
                    disabled={prefsSaving}
                    checked={Boolean(notificationPrefs?.[item.key])}
                    onChange={() => handleToggleNotifPref(item.key)}
                    className="h-4 w-4 accent-[#118AB2]"
                  />
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* 2. Profile & PRC Credentials + Change Password */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <h2 className="flex items-center gap-2 text-base font-extrabold">
              <Award className="h-5 w-5 text-[#118AB2]" />
              <span>3. Profile &amp; Verified PRC Credentials</span>
            </h2>
            <form onSubmit={handleSaveProfileCredentials} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/60 p-3.5">
                <div>
                  <span className="block text-[10px] font-bold uppercase opacity-70">
                    Account Email
                  </span>
                  <span className="font-mono font-extrabold">{profile?.email}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase opacity-70">
                    Locked Branch Assignment
                  </span>
                  <span className="inline-flex items-center gap-1 font-extrabold text-[#118AB2]">
                    <Lock className="h-3 w-3" />
                    <span>{branchLabel}</span>
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-extrabold">Full Name &amp; Clinical Title</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3.5 py-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold">PRC License Number</label>
                  <input
                    type="text"
                    value={prcNumber}
                    onChange={(e) => setPrcNumber(e.target.value)}
                    placeholder="PRC-0148291"
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3.5 py-2 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold">PRC Expiration Date</label>
                  <input
                    type="date"
                    value={prcExpiry}
                    onChange={(e) => setPrcExpiry(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3.5 py-2 font-semibold"
                  />
                </div>
              </div>

              {profileMsg && (
                <p
                  className={`font-extrabold ${
                    profileMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {profileMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E] disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                <span>
                  {profileSaving ? 'Saving to Supabase...' : 'Save Profile & PRC Credentials'}
                </span>
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <h2 className="flex items-center gap-2 text-base font-extrabold">
              <KeyRound className="h-5 w-5 text-[#118AB2]" />
              <span>4. Update Supabase Auth Password</span>
            </h2>
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-3 text-xs">
              <input
                type="password"
                placeholder="New password (min. 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3.5 py-2 font-semibold"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3.5 py-2 font-semibold"
              />
              {passwordStatus.text && (
                <p
                  className={`font-extrabold ${
                    passwordStatus.type === 'success'
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}
                >
                  {passwordStatus.text}
                </p>
              )}
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#464B71] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#343857] disabled:opacity-60"
              >
                {passwordSaving ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout() {
  const {
    profile,
    role,
    signOut,
    isDark,
    toggleDashboardTheme,
    notificationPrefs,
    updatePreferences,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [moduleTransitionMsg, setModuleTransitionMsg] = useState(null);

  // Live Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('victorio_abc_read_notifs');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const notifRef = useRef(null);

  const assignedBranch = profile?.branch_id
    ? getBranchBySlug(profile.branch_id)
    : null;
  const branchLabel =
    role === ROLES.ADMIN
      ? 'All 7 Official Branches'
      : assignedBranch
        ? formatBranchLabel(assignedBranch)
        : 'Santa Maria Branch';

  const lockedPortalBadgeText =
    role === ROLES.ADMIN
      ? 'Owner Command Center • All 7 Branches'
      : role === ROLES.DOCTOR
        ? `Doctor Portal • ${branchLabel}`
        : `Nurse Portal • ${branchLabel}`;

  const modules = ROLE_MODULES[role] || [];
  const defaultTab = modules[0]?.tab || 'matrix';
  const rawTab = searchParams.get('tab');
  const activeTab =
    location.pathname.endsWith('/settings')
      ? 'settings'
      : modules.some((m) => m.tab === rawTab)
        ? rawTab
        : defaultTab;

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await api.get('/notifications');
      const items = res?.data?.notifications || res?.data?.data || [];
      setNotifications(Array.isArray(items) ? items : []);
    } catch {
      // keep existing notifications on transient error
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('victorio_abc_read_notifs', JSON.stringify(allIds));
    }
  };

  const handleSelectModule = (tabKey, label) => {
    setSidebarOpen(false);
    if (tabKey === activeTab && location.pathname === getRoleHome(role)) return;

    setModuleTransitionMsg(`Loading ${label}...`);
    setTimeout(() => {
      setModuleTransitionMsg(null);
    }, 360);

    const homePath = getRoleHome(role);
    navigate(`${homePath}?tab=${tabKey}`);
  };

  const handleNotificationJump = (notif) => {
    const nextRead = Array.from(new Set([...readIds, notif.id]));
    setReadIds(nextRead);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('victorio_abc_read_notifs', JSON.stringify(nextRead));
    }
    setNotifOpen(false);
    const targetTab = notif.target_tab || defaultTab;
    const homePath = getRoleHome(role);
    navigate(`${homePath}?tab=${targetTab}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div
      data-testid="dashboard-shell"
      className={`flex min-h-screen overflow-x-clip transition-colors duration-200 ${
        isDark
          ? 'dashboard-dark bg-[#0F172A] text-slate-100'
          : 'bg-[#F2F2ED] text-[#464B71]'
      }`}
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Decluttered Clinical Sidebar (4–5 Focused Views, Zero Branch Switcher) */}
      <aside
        aria-label="Clinical Workspace Sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarCollapsed ? 'w-20' : 'w-72 max-w-[86vw]'
        } ${
          isDark
            ? 'border-slate-800 bg-[#131C31] text-slate-100'
            : 'border-[#343857] bg-[#464B71] text-white'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex shrink-0 flex-col border-b border-white/10 px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={getRoleHome(role)}
              className="flex min-w-0 items-center gap-3 focus-visible:outline-none"
            >
              <img
                src="/victorio_logo.jpg"
                alt="Victorio ABC Logo"
                className="h-11 w-11 shrink-0 rounded-full border-2 border-[#7CD5C7] bg-white object-cover shadow-md"
              />
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold tracking-tight text-white">
                    Victorio ABC
                  </p>
                  <p className="truncate text-[11px] font-bold text-[#7CD5C7]">
                    {role === ROLES.ADMIN
                      ? 'Owner Command Center'
                      : role === ROLES.DOCTOR
                        ? 'Physician Workspace'
                        : 'Clinical Nurse Portal'}
                  </p>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white lg:inline-flex"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!sidebarCollapsed && (
            <div
              data-testid="locked-branch-badge"
              className="mt-3 flex items-center gap-2 rounded-xl border border-[#7CD5C7]/30 bg-white/10 px-3 py-2 text-xs font-extrabold text-[#7CD5C7]"
            >
              <Lock className="h-3.5 w-3.5 shrink-0 text-[#7CD5C7]" />
              <span className="truncate">{branchLabel}</span>
            </div>
          )}
        </div>

        {/* 4–5 Crisp, Focused Sidebar Views */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {!sidebarCollapsed && (
            <p className="px-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-white/55">
              Workspace Views
            </p>
          )}
          {modules.map(({ tab, label, subtitle, icon: Icon }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleSelectModule(tab, label)}
                title={sidebarCollapsed ? label : undefined}
                className={`flex min-h-[50px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition ${
                  isActive
                    ? 'bg-[#118AB2] text-white shadow-md ring-1 ring-[#7CD5C7]/50'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 text-[#7CD5C7]" />
                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold">{label}</p>
                    <p className="truncate text-[10px] font-medium text-white/70">
                      {subtitle}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Verified PRC Credential Footer */}
        <div className="border-t border-white/10 p-3">
          {!sidebarCollapsed && (
            <div className="rounded-xl bg-white/5 px-3 py-2.5 text-[11px]">
              <div className="flex items-center justify-between text-white/75">
                <span className="font-bold">PRC Credential</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-300">
                  VERIFIED
                </span>
              </div>
              <p className="mt-0.5 font-mono text-xs font-extrabold text-[#7CD5C7]">
                {profile?.prc_license_number || 'PRC-VERIFIED'}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Top Utility Bar */}
        <header
          className={`sticky top-0 z-20 flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 shadow-2xs transition-colors sm:px-6 ${
            isDark
              ? 'border-slate-800 bg-[#1E293B]/95 text-slate-100 backdrop-blur-md'
              : 'border-[#DDDCD4] bg-white/95 text-[#464B71] backdrop-blur-md'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl lg:hidden ${
                isDark
                  ? 'text-slate-200 hover:bg-slate-800'
                  : 'text-[#464B71] hover:bg-[#F2F2ED]'
              }`}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div
              data-testid="top-locked-role-branch-badge"
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-extrabold sm:text-sm ${
                isDark
                  ? 'border-slate-700 bg-slate-800/90 text-[#7CD5C7]'
                  : 'border-[#118AB2]/30 bg-[#118AB2]/10 text-[#464B71]'
              }`}
            >
              <Lock className="h-3.5 w-3.5 shrink-0 text-[#118AB2]" />
              <span className="truncate">{lockedPortalBadgeText}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Real-Time Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                data-testid="notification-center-trigger"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Open Real-Time Notification Center"
                className={`relative inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 hover:border-[#7CD5C7]'
                    : 'border-[#DDDCD4] bg-[#F2F2ED] text-[#464B71] hover:border-[#118AB2]'
                }`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span
                    data-testid="notification-unread-badge"
                    className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold text-white shadow-xs"
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  role="dialog"
                  aria-label="Real-Time Notification Center"
                  className={`absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border p-3 shadow-2xl sm:w-96 ${
                    isDark
                      ? 'border-slate-700 bg-[#1E293B] text-slate-100'
                      : 'border-[#DDDCD4] bg-white text-[#464B71]'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-current/10 pb-2.5">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-[#118AB2]">
                        Live Clinical Alerts
                      </p>
                      <p className="text-[11px] opacity-75">
                        {unreadCount} unread • Synced with Supabase DB
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={fetchNotifications}
                        title="Refresh live alerts"
                        className="rounded-lg p-1.5 opacity-75 hover:bg-current/10 hover:opacity-100"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${notifLoading ? 'animate-spin' : ''}`}
                        />
                      </button>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="rounded-lg bg-[#118AB2]/15 px-2.5 py-1 text-[11px] font-extrabold text-[#118AB2] hover:bg-[#118AB2]/25"
                        >
                          Mark All Read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 max-h-80 space-y-2 overflow-y-auto pr-0.5">
                    {notifications.length === 0 ? (
                      <div className="rounded-xl py-8 text-center text-xs opacity-75">
                        No active clinical or cold-chain alerts right now.
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isUnread = !readIds.includes(n.id);
                        const sevClasses =
                          n.severity === 'critical'
                            ? isDark
                              ? 'border-red-500/40 bg-red-950/40'
                              : 'border-red-200 bg-red-50'
                            : n.severity === 'warning'
                              ? isDark
                                ? 'border-amber-500/40 bg-amber-950/35'
                                : 'border-amber-200 bg-amber-50'
                              : isDark
                                ? 'border-slate-700 bg-slate-800/70'
                                : 'border-[#DDDCD4] bg-[#F2F2ED]/60';
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleNotificationJump(n)}
                            className={`flex w-full flex-col rounded-xl border p-3 text-left transition hover:scale-[1.01] ${sevClasses}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                  n.severity === 'critical'
                                    ? 'bg-red-600 text-white'
                                    : n.severity === 'warning'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-[#118AB2] text-white'
                                }`}
                              >
                                {n.branch_name}
                              </span>
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-[#118AB2]" />
                              )}
                            </div>
                            <p className="mt-1.5 text-xs font-extrabold">{n.title}</p>
                            <p className="mt-0.5 text-[11px] leading-snug opacity-85">
                              {n.message}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Light / Dark Mode Toggle */}
            <button
              type="button"
              data-testid="dashboard-theme-toggle"
              onClick={toggleDashboardTheme}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-[#7CD5C7] hover:border-[#7CD5C7]'
                  : 'border-[#DDDCD4] bg-[#F2F2ED] text-[#464B71] hover:border-[#118AB2]'
              }`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Quick Jump to Settings View */}
            <button
              type="button"
              data-testid="dashboard-settings-trigger"
              onClick={() => handleSelectModule('settings', 'Settings')}
              aria-label="Open Workspace Settings"
              title="Workspace Settings & Credentials"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                activeTab === 'settings'
                  ? 'border-[#118AB2] bg-[#118AB2] text-white'
                  : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-[#7CD5C7]'
                    : 'border-[#DDDCD4] bg-[#F2F2ED] text-[#464B71] hover:border-[#118AB2]'
              }`}
            >
              <Settings className="h-4 w-4" />
            </button>

            <div className="hidden text-right md:block">
              <p className="max-w-[13rem] truncate text-xs font-extrabold">
                {profile?.full_name || 'Clinical Staff'}
              </p>
              <p className="font-mono text-[10px] font-bold text-[#118AB2]">
                {profile?.prc_license_number || profile?.email}
              </p>
            </div>

            <button
              type="button"
              data-testid="dashboard-logout-btn"
              onClick={handleLogout}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition ${
                isDark
                  ? 'border-red-500/40 bg-red-950/40 text-red-200 hover:bg-red-900/50'
                  : 'border-[#DDDCD4] bg-[#F2F2ED] text-[#464B71] hover:bg-red-50 hover:text-red-700'
              }`}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </header>

        {/* Focused Single-View Workspace Area */}
        <main className="relative min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {moduleTransitionMsg ? (
            <BufferLoader
              message={moduleTransitionMsg}
              fullScreen={false}
              isDark={isDark}
            />
          ) : activeTab === 'settings' ? (
            <WorkspaceSettingsView
              profile={profile}
              role={role}
              branchLabel={branchLabel}
              isDark={isDark}
              updatePreferences={updatePreferences}
              notificationPrefs={notificationPrefs}
            />
          ) : (
            <Outlet context={{ isDark, activeTab, setSearchParams }} />
          )}
        </main>
      </div>
    </div>
  );
}

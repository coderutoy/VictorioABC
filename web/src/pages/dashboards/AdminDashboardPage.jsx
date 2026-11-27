import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  FlaskConical,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  ArrowRightLeft,
  ThermometerSnowflake,
  CheckCircle2,
  X,
  Plus,
  Edit3,
  Download,
  Banknote,
  Users,
  PhoneMissed,
  FileSpreadsheet,
  BellRing,
  Eye,
  Lock,
} from 'lucide-react';
import api from '../../lib/api';
import { OFFICIAL_BRANCHES } from '../../config/branches';
import { WorkspaceSkeleton } from '../../components/ui/BufferLoader';

function formatPhp(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const ADMIN_TABS = [
  { id: 'matrix', label: '7-Branch Matrix & KPIs', icon: Building2 },
  { id: 'predictive', label: '14-Day Stockout & Rebalance', icon: TrendingUp },
  { id: 'yield', label: 'Multi-Dose Vial Yield', icon: FlaskConical },
  { id: 'staff', label: 'Staff & PRC Governance', icon: ShieldCheck },
  { id: 'audit', label: 'Immutable Audit Log', icon: FileCheck2 },
];

export function AdminDashboardPage() {
  const outletCtx = useOutletContext() || {};
  const isDark = Boolean(outletCtx.isDark);
  const activeTab = outletCtx.activeTab || 'matrix';
  const setSearchParams = outletCtx.setSearchParams;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Drill-down drawer state for 7-Branch Comparison Matrix
  const [selectedBranchRow, setSelectedBranchRow] = useState(null);
  const [missedDrawerOpen, setMissedDrawerOpen] = useState(false);

  // Rebalance execution state
  const [transferringId, setTransferringId] = useState(null);

  // Staff Governance modals
  const [staffBranchFilter, setStaffBranchFilter] = useState('all');
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffForm, setStaffForm] = useState({
    email: '',
    password: 'VictorioABC@2026',
    full_name: '',
    role: 'nurse',
    branch_id: 'santa-maria',
    prc_license_number: '',
    prc_expiry_date: '2028-06-30',
    is_active: true,
  });

  // Audit filter
  const [auditFilter, setAuditFilter] = useState('ALL');

  const fetchCommandCenter = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/command-center');
      setData(res?.data?.data || null);
    } catch (err) {
      setError(
        err?.userMessage ||
          err?.message ||
          'Failed to load live Owner Command Center data from Supabase.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommandCenter();
  }, [fetchCommandCenter]);

  const switchTab = (tabId) => {
    if (setSearchParams) {
      setSearchParams({ tab: tabId });
    }
  };

  const handleExecuteRebalance = async (rec) => {
    setTransferringId(rec.id);
    setNotice(null);
    try {
      await api.post('/admin/rebalance-transfer', {
        from_branch_id: rec.from_branch_id,
        to_branch_id: rec.to_branch_id,
        batch_number: rec.batch_number,
        vials_count: rec.recommended_vials,
        reason: rec.rationale,
      });
      setNotice(
        `Executed transfer: ${rec.recommended_vials} FEFO vials (${rec.batch_number}) moved from ${rec.from_branch_name} to ${rec.to_branch_name}.`
      );
      await fetchCommandCenter();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to execute rebalance transfer.');
    } finally {
      setTransferringId(null);
    }
  };

  const openAddStaffModal = () => {
    setEditingStaff(null);
    setStaffForm({
      email: '',
      password: 'VictorioABC@2026',
      full_name: '',
      role: 'nurse',
      branch_id: 'santa-maria',
      prc_license_number: '',
      prc_expiry_date: '2028-06-30',
      is_active: true,
    });
    setStaffModalOpen(true);
  };

  const openEditStaffModal = (member) => {
    setEditingStaff(member);
    setStaffForm({
      email: member.email || '',
      password: '',
      full_name: member.full_name || '',
      role: member.role || 'nurse',
      branch_id: member.branch_id || 'santa-maria',
      prc_license_number: member.prc_license_number || member.license_number || '',
      prc_expiry_date: member.prc_expiry_date || '2028-06-30',
      is_active: member.is_active !== false,
    });
    setStaffModalOpen(true);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffSubmitting(true);
    setNotice(null);
    try {
      if (editingStaff) {
        await api.patch(`/admin/staff/${editingStaff.id}`, {
          full_name: staffForm.full_name,
          role: staffForm.role,
          branch_id: staffForm.role === 'admin' ? null : staffForm.branch_id,
          prc_license_number: staffForm.prc_license_number,
          prc_expiry_date: staffForm.prc_expiry_date,
          is_active: staffForm.is_active,
        });
        setNotice(`Updated staff governance for ${staffForm.full_name}.`);
      } else {
        await api.post('/admin/staff', {
          email: staffForm.email,
          password: staffForm.password || 'VictorioABC@2026',
          full_name: staffForm.full_name,
          role: staffForm.role,
          branch_id: staffForm.role === 'admin' ? null : staffForm.branch_id,
          prc_license_number: staffForm.prc_license_number,
          prc_expiry_date: staffForm.prc_expiry_date,
        });
        setNotice(`Provisioned new ${staffForm.role.toUpperCase()} account for ${staffForm.full_name}.`);
      }
      setStaffModalOpen(false);
      await fetchCommandCenter();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to save staff credential.');
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleExportAuditCsv = () => {
    const audits = data?.auditLogs || [];
    const header = ['Timestamp', 'Branch', 'Staff Actor', 'Action Type', 'Entity', 'Reason'];
    const rows = audits.map((a) => [
      a.created_at,
      a.branch_name,
      a.actor_name,
      a.action_type,
      a.entity_type,
      `"${String(a.reason || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `victorio-abc-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return <WorkspaceSkeleton isDark={isDark} />;
  }

  if (error && !data) {
    return (
      <div
        role="alert"
        className="rounded-3xl border-2 border-red-400 bg-red-50 p-6 text-red-900 shadow-md"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
          <div className="space-y-2">
            <h2 className="text-base font-extrabold">
              Unable to Load Live Supabase Command Center Data
            </h2>
            <p className="text-xs leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={fetchCommandCenter}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Live Query</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kpi = data?.kpiStrip || {};
  const branchMatrix = data?.branchMatrix || [];
  const predictive = data?.predictiveStockout || { branches: [], recommendations: [] };
  const vialYield = data?.vialYieldAnalytics || { branches: [], recentVials: [] };
  const staffList = data?.staffGovernance || [];
  const auditLogs = data?.auditLogs || [];

  const filteredStaff =
    staffBranchFilter === 'all'
      ? staffList
      : staffList.filter(
          (s) => s.branch_id === staffBranchFilter || s.role === 'admin'
        );

  const filteredAudits =
    auditFilter === 'ALL'
      ? auditLogs
      : auditLogs.filter((a) => a.action_type === auditFilter);

  const actionTypes = ['ALL', ...Array.from(new Set(auditLogs.map((a) => a.action_type)))];

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#118AB2]/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#118AB2]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Super Admin / Owner Command Center • All 7 Official Branches</span>
          </div>
          <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
            Network Intelligence, FEFO Stockout Engine &amp; Clinical Governance
          </h1>
          <p className="text-xs opacity-75">
            100% live Supabase PostgreSQL telemetry across Baliwag, Santa Maria, Pandi, DRT, Meycauayan (Camalig &amp; Poblacion), and Cefels Caloocan.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCommandCenter}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#0D6E8E] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Live Network DB</span>
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-emerald-950"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-lg p-1 hover:bg-emerald-200/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-red-400 bg-red-50 px-4 py-3 text-xs font-extrabold text-red-950"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchCommandCenter}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. NETWORK-WIDE LIVE KPI STRIP (5 Executive Cards) */}
      <section aria-label="Network-Wide KPI Strip" className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Total Daily Revenue */}
        <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-75">
              Total Daily Revenue
            </span>
            <Banknote className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">
            {formatPhp(kpi.totalDailyRevenuePhp)}
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-1 border-t border-[#DDDCD4]/60 pt-2 text-[10px] font-bold opacity-85">
            <span>Cash: {formatPhp(kpi.revenueByMethod?.cash)}</span>
            <span>GCash/Maya: {formatPhp(kpi.revenueByMethod?.gcash_maya)}</span>
            <span>Card: {formatPhp(kpi.revenueByMethod?.card)}</span>
            <span>HMO: {formatPhp(kpi.revenueByMethod?.hmo)}</span>
          </div>
        </div>

        {/* Card 2: Total Patients Treated */}
        <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-75">
              Total Patients Treated
            </span>
            <Users className="h-4 w-4 text-[#118AB2]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold">
            {kpi.totalPatientsTreated?.total ?? 0}
          </p>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#DDDCD4]/60 pt-2 text-[11px] font-bold">
            <span className="text-[#118AB2]">
              New Walk-Ins: {kpi.totalPatientsTreated?.newCases ?? 0}
            </span>
            <span className="text-emerald-600">
              Boosters: {kpi.totalPatientsTreated?.scheduledBoosters ?? 0}
            </span>
          </div>
        </div>

        {/* Card 3: Network Missed Follow-Ups (Red Alert Badge + Drill-Down) */}
        <div className="rounded-2xl border-2 border-red-400/70 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
              Network Missed Follow-Ups
            </span>
            <PhoneMissed className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-red-600">
              {kpi.missedFollowUps?.count ?? 0}
            </p>
            <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
              {kpi.missedFollowUps?.cat3Count ?? 0} Cat III Critical
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMissedDrawerOpen(true)}
            className="mt-2.5 inline-flex w-full items-center justify-between border-t border-[#DDDCD4]/60 pt-2 text-[11px] font-extrabold text-red-600 hover:underline"
          >
            <span>Inspect Defaulter Roster &rarr;</span>
          </button>
        </div>

        {/* Card 4: Pending PhilHealth ABTP Receivables */}
        <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-75">
              Pending PhilHealth ABTP
            </span>
            <FileSpreadsheet className="h-4 w-4 text-[#118AB2]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#118AB2]">
            {formatPhp(kpi.pendingPhilhealthAbtp?.amountPhp)}
          </p>
          <p className="mt-2.5 border-t border-[#DDDCD4]/60 pt-2 text-[11px] font-bold opacity-80">
            {kpi.pendingPhilhealthAbtp?.claimsCount ?? 0} PRC-Validated ABTP Claims
          </p>
        </div>

        {/* Card 5: Active System Alerts */}
        <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-75">
              Active System Alerts
            </span>
            <BellRing className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">
            {kpi.activeSystemAlerts?.total ?? 0}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[#DDDCD4]/60 pt-2 text-[10px] font-extrabold">
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-800">
              {kpi.activeSystemAlerts?.coldChainBreaches ?? 0} Cold-Chain
            </span>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">
              {kpi.activeSystemAlerts?.lowStockBranches ?? 0} Stockout Risk
            </span>
            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-900">
              {kpi.activeSystemAlerts?.pendingHighRiskAi ?? 0} AI Cat III
            </span>
          </div>
        </div>
      </section>

      {/* Module Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {ADMIN_TABS.map(({ id, label, icon: Icon }) => {
          const isCurrent = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                isCurrent
                  ? 'bg-[#118AB2] text-white shadow-sm'
                  : 'border border-[#DDDCD4] bg-white hover:border-[#118AB2]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 7-BRANCH COMPARISON MATRIX */}
      {activeTab === 'matrix' && (
        <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
            <div>
              <h2 className="text-lg font-extrabold">
                7-Branch Operational Comparison Matrix
              </h2>
              <p className="text-xs opacity-75">
                Click any branch row to open its read-only operational drill-down drawer (cases, FEFO stock, active vials, cold-chain &amp; audits).
              </p>
            </div>
            <span className="rounded-full bg-[#7CD5C7]/30 px-3 py-1 text-xs font-extrabold">
              {branchMatrix.length} Official Branches Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDDCD4] bg-[#F2F2ED] text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="rounded-tl-xl px-3.5 py-3">Official Branch</th>
                  <th className="px-3.5 py-3">Daily Sales</th>
                  <th className="px-3.5 py-3">Patients (New / Booster)</th>
                  <th className="px-3.5 py-3">PVRV Vials Left</th>
                  <th className="px-3.5 py-3">ERIG / HRIG Left</th>
                  <th className="px-3.5 py-3">Latest Cold-Chain (°C)</th>
                  <th className="px-3.5 py-3">Open-Vial Wastage (%)</th>
                  <th className="px-3.5 py-3">Audit Status</th>
                  <th className="rounded-tr-xl px-3.5 py-3 text-right">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDCD4]/70">
                {branchMatrix.map((row) => (
                  <tr
                    key={row.branch_id}
                    onClick={() => setSelectedBranchRow(row)}
                    className="cursor-pointer transition hover:bg-[#118AB2]/5"
                  >
                    <td className="px-3.5 py-3.5">
                      <p className="font-extrabold">{row.short_name}</p>
                      <p className="text-[11px] opacity-70">{row.phone}</p>
                    </td>
                    <td className="px-3.5 py-3.5 font-extrabold text-emerald-600">
                      {formatPhp(row.dailySalesPhp)}
                      {row.pendingPhilhealthPhp > 0 && (
                        <span className="block text-[10px] font-semibold text-[#118AB2]">
                          +{formatPhp(row.pendingPhilhealthPhp)} ABTP
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3.5 font-bold">
                      <span className="text-[#118AB2]">{row.newCasesCount} New</span>
                      <span className="mx-1.5 opacity-40">/</span>
                      <span className="text-emerald-600">{row.boosterCount} Boosters</span>
                    </td>
                    <td className="px-3.5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 font-extrabold ${
                          row.pvrvVialsLeft <= 25
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {row.pvrvVialsLeft} vials
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 font-extrabold">
                      {row.erigHrigLeft} vials
                    </td>
                    <td className="px-3.5 py-3.5">
                      {row.latestTempC !== null ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-extrabold ${
                            row.isColdChainBreach
                              ? 'bg-red-600 text-white'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          <ThermometerSnowflake className="h-3.5 w-3.5" />
                          <span>{row.latestTempC}°C</span>
                        </span>
                      ) : (
                        <span className="opacity-60">No reading</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3.5">
                      <span
                        className={`font-extrabold ${
                          row.openVialWastageRatePct >= 20
                            ? 'text-red-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {row.openVialWastageRatePct}%
                      </span>
                      <span className="block text-[10px] opacity-70">
                        {row.wastedVialDoses} wasted / {row.totalReconstitutedDoses} cap
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                          row.auditStatus === 'Compliant'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-red-100 text-red-900'
                        }`}
                      >
                        {row.auditStatus}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBranchRow(row);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#118AB2]/10 px-3 py-1.5 text-[11px] font-extrabold text-[#118AB2] hover:bg-[#118AB2] hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: 14-DAY PREDICTIVE STOCKOUT & AUTO-REBALANCING ENGINE */}
      {activeTab === 'predictive' && (
        <div className="space-y-6">
          {/* Actionable Auto-Rebalancing Recommendations */}
          <section className="rounded-3xl border-2 border-[#118AB2] bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <div>
                <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-[11px] font-extrabold uppercase text-[#118AB2]">
                  FEFO Auto-Rebalancing Engine
                </span>
                <h2 className="mt-1 text-lg font-extrabold">
                  Recommended Inter-Branch PVRV Vial Transfers
                </h2>
                <p className="text-xs opacity-75">
                  Automatically matches branches projected to stock out within 14 days with branches holding surplus near-expiry FEFO batches.
                </p>
              </div>
            </div>

            {predictive.recommendations.length === 0 ? (
              <div className="rounded-2xl border border-[#DDDCD4] p-6 text-center text-xs font-bold opacity-75">
                All 7 branches currently exceed their 14-day projected booster demand. No inter-branch transfers required.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {predictive.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/60 p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900">
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                          <span>
                            {rec.from_branch_name} &rarr; {rec.to_branch_name}
                          </span>
                        </span>
                        <span className="font-mono text-xs font-extrabold text-[#118AB2]">
                          {rec.recommended_vials} Vials
                        </span>
                      </div>
                      <p className="mt-2.5 text-xs font-extrabold">
                        {rec.item_name} • Lot {rec.batch_number} (Exp: {rec.expiry_date})
                      </p>
                      <p className="mt-1 text-xs leading-relaxed opacity-85">
                        {rec.rationale}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                      <button
                        type="button"
                        disabled={transferringId === rec.id}
                        onClick={() => handleExecuteRebalance(rec)}
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#0D6E8E] disabled:opacity-60"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        <span>
                          {transferringId === rec.id
                            ? 'Transferring Stock...'
                            : `Approve & Transfer ${rec.recommended_vials} Vials`}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 14-Day Burn Rate Table Across All 7 Branches */}
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
            <h3 className="text-base font-extrabold">
              14-Day Scheduled PEP Booster Burn-Rate &amp; Stockout Projection
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDDCD4] bg-[#F2F2ED] text-[11px] font-extrabold uppercase">
                    <th className="px-3.5 py-3">Branch</th>
                    <th className="px-3.5 py-3">Current PVRV Stock</th>
                    <th className="px-3.5 py-3">Scheduled Boosters (14d)</th>
                    <th className="px-3.5 py-3">Projected 14d Vial Need</th>
                    <th className="px-3.5 py-3">Daily Burn Rate</th>
                    <th className="px-3.5 py-3">Est. Days Until Stockout</th>
                    <th className="px-3.5 py-3">Near-Expiry (&le;60d)</th>
                    <th className="px-3.5 py-3">Risk Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDDCD4]/70">
                  {predictive.branches.map((b) => (
                    <tr key={b.branch_id}>
                      <td className="px-3.5 py-3 font-extrabold">{b.short_name}</td>
                      <td className="px-3.5 py-3 font-extrabold">{b.pvrvVialsLeft} vials</td>
                      <td className="px-3.5 py-3 font-bold text-[#118AB2]">
                        {b.scheduledBoosters14d} scheduled doses
                      </td>
                      <td className="px-3.5 py-3 font-bold">
                        {b.projectedVialsNeeded14d} vials
                      </td>
                      <td className="px-3.5 py-3 font-mono">{b.dailyBurnVials} vials/day</td>
                      <td className="px-3.5 py-3 font-extrabold">
                        {b.estimatedDaysUntilStockout} days
                      </td>
                      <td className="px-3.5 py-3 font-bold text-amber-600">
                        {b.nearExpiryVialsCount} vials
                      </td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                            b.riskLevel === 'critical'
                              ? 'bg-red-600 text-white'
                              : b.riskLevel === 'warning'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {b.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: MULTI-DOSE VIAL YIELD & SHRINKAGE INTELLIGENCE */}
      {activeTab === 'yield' && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <div>
                <h2 className="text-lg font-extrabold">
                  Multi-Dose PVRV Vial Yield &amp; Shrinkage Intelligence
                </h2>
                <p className="text-xs opacity-75">
                  Compares reconstituted 6-hour multi-dose PVRV vials (5 ID doses/vial) against actual administered ID doses and discard wastage.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-extrabold">
                <span className="rounded-xl bg-emerald-100 px-3 py-1.5 text-emerald-900">
                  Administered: {vialYield.networkAdministeredDoses} ID Doses
                </span>
                <span className="rounded-xl bg-red-100 px-3 py-1.5 text-red-900">
                  Wasted: {vialYield.networkWastedDoses} ID Doses
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDDCD4] bg-[#F2F2ED] text-[11px] font-extrabold uppercase">
                    <th className="px-3.5 py-3">Branch</th>
                    <th className="px-3.5 py-3">Vials Reconstituted</th>
                    <th className="px-3.5 py-3">Total ID Dose Capacity</th>
                    <th className="px-3.5 py-3">Administered ID Doses</th>
                    <th className="px-3.5 py-3">6-Hr Expired / Wasted</th>
                    <th className="px-3.5 py-3">Yield Efficiency (%)</th>
                    <th className="px-3.5 py-3">Wastage Rate (%)</th>
                    <th className="px-3.5 py-3">Shrinkage Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDDCD4]/70">
                  {vialYield.branches.map((b) => (
                    <tr key={b.branch_id}>
                      <td className="px-3.5 py-3 font-extrabold">{b.short_name}</td>
                      <td className="px-3.5 py-3 font-bold">{b.vialsOpenedCount} vials</td>
                      <td className="px-3.5 py-3">{b.totalDosesCapacity} doses</td>
                      <td className="px-3.5 py-3 font-extrabold text-emerald-600">
                        {b.administeredDoses} doses
                      </td>
                      <td className="px-3.5 py-3 font-extrabold text-red-600">
                        {b.wastedDoses} doses
                      </td>
                      <td className="px-3.5 py-3 font-extrabold text-[#118AB2]">
                        {b.yieldRatePct}%
                      </td>
                      <td className="px-3.5 py-3 font-extrabold">
                        {b.wastageRatePct}%
                      </td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            b.isHighWastageFlag
                              ? 'bg-red-100 text-red-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {b.isHighWastageFlag
                            ? 'Elevated Wastage / Variance'
                            : 'Optimal Yield'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: STAFF GOVERNANCE & PRC LICENSE EXPIRATION MONITOR */}
      {activeTab === 'staff' && (
        <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <h2 className="text-lg font-extrabold">
                Staff Branch Assignments &amp; PRC License Governance
              </h2>
              <p className="text-xs opacity-75">
                Strict branch lock enforcement for Doctors &amp; Nurses with real-time PRC credential expiration tracking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={staffBranchFilter}
                onChange={(e) => setStaffBranchFilter(e.target.value)}
                aria-label="Filter staff by branch"
                className="min-h-[42px] rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3 py-2 text-xs font-extrabold"
              >
                <option value="all">All 7 Official Branches</option>
                {OFFICIAL_BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortName}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={openAddStaffModal}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
              >
                <Plus className="h-4 w-4" />
                <span>Provision Staff Account</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDDCD4] bg-[#F2F2ED] text-[11px] font-extrabold uppercase">
                  <th className="px-3.5 py-3">Staff Member</th>
                  <th className="px-3.5 py-3">Role</th>
                  <th className="px-3.5 py-3">Locked Branch Assignment</th>
                  <th className="px-3.5 py-3">PRC License No.</th>
                  <th className="px-3.5 py-3">PRC Expiry Date</th>
                  <th className="px-3.5 py-3">Credential Status</th>
                  <th className="px-3.5 py-3 text-right">Governance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDCD4]/70">
                {filteredStaff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-3.5 py-3">
                      <p className="font-extrabold">{member.full_name}</p>
                      <p className="font-mono text-[11px] opacity-75">{member.email}</p>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="rounded-full bg-[#118AB2]/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-[#118AB2]">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-bold">
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-3 w-3 text-[#118AB2]" />
                        <span>{member.branch_name}</span>
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-mono font-extrabold">
                      {member.prc_license_number || '—'}
                    </td>
                    <td className="px-3.5 py-3 font-bold">
                      {member.prc_expiry_date || '—'}
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                          member.prcStatus === 'expired'
                            ? 'bg-red-600 text-white'
                            : member.prcStatus === 'expiring_soon'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {member.prcStatus === 'expiring_soon'
                          ? `Expiring (${member.daysUntilExpiry}d)`
                          : member.prcStatus}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEditStaffModal(member)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#DDDCD4] px-3 py-1.5 text-[11px] font-extrabold hover:border-[#118AB2]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit / Reassign</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 5: IMMUTABLE SENSITIVE ACTION AUDIT LOG */}
      {activeTab === 'audit' && (
        <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div>
              <h2 className="text-lg font-extrabold">
                Immutable Sensitive Action Audit Log
              </h2>
              <p className="text-xs opacity-75">
                Append-only compliance ledger for AI overrides, electronic PRC sign-offs, cold-chain breaches, discounts, and stock transfers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                aria-label="Filter audit log by action type"
                className="min-h-[42px] rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3 py-2 text-xs font-extrabold"
              >
                {actionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'ALL' ? 'All Sensitive Actions' : type}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportAuditCsv}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#464B71] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#343857]"
              >
                <Download className="h-4 w-4" />
                <span>Export Audit CSV</span>
              </button>
            </div>
          </div>

          {filteredAudits.length === 0 ? (
            <div className="rounded-2xl border border-[#DDDCD4] p-8 text-center text-xs font-bold opacity-75">
              No sensitive action audit records match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDDCD4] bg-[#F2F2ED] text-[11px] font-extrabold uppercase">
                    <th className="px-3.5 py-3">Timestamp</th>
                    <th className="px-3.5 py-3">Branch</th>
                    <th className="px-3.5 py-3">Authenticated Staff</th>
                    <th className="px-3.5 py-3">Action Type</th>
                    <th className="px-3.5 py-3">Clinical / Operational Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDDCD4]/70">
                  {filteredAudits.map((a) => (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap px-3.5 py-3 font-mono text-[11px]">
                        {formatDateTime(a.created_at)}
                      </td>
                      <td className="px-3.5 py-3 font-extrabold">{a.branch_name}</td>
                      <td className="px-3.5 py-3 font-bold text-[#118AB2]">
                        {a.actor_name}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="rounded-full bg-[#118AB2]/15 px-2.5 py-0.5 font-mono text-[10px] font-extrabold text-[#118AB2]">
                          {a.action_type}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 leading-relaxed">{a.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* READ-ONLY OPERATIONAL DRILL-DOWN DRAWER FOR SELECTED BRANCH */}
      {selectedBranchRow && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Operational Drill-Down: ${selectedBranchRow.short_name}`}
          className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/65 backdrop-blur-xs"
        >
          <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-[#DDDCD4] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#DDDCD4] pb-4">
              <div>
                <span className="rounded-full bg-[#118AB2]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#118AB2]">
                  Read-Only Operational Drill-Down
                </span>
                <h2 className="mt-1 text-xl font-extrabold">
                  {selectedBranchRow.branch_name}
                </h2>
                <p className="text-xs opacity-75">
                  {selectedBranchRow.address} • {selectedBranchRow.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBranchRow(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDDCD4]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED] p-3">
                  <span className="text-[10px] font-bold uppercase opacity-75">
                    Daily Revenue
                  </span>
                  <p className="mt-1 text-base font-extrabold text-emerald-600">
                    {formatPhp(selectedBranchRow.dailySalesPhp)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED] p-3">
                  <span className="text-[10px] font-bold uppercase opacity-75">
                    PVRV / ERIG Stock
                  </span>
                  <p className="mt-1 text-base font-extrabold">
                    {selectedBranchRow.pvrvVialsLeft} PVRV • {selectedBranchRow.erigHrigLeft} ERIG
                  </p>
                </div>
                <div className="rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED] p-3">
                  <span className="text-[10px] font-bold uppercase opacity-75">
                    Latest Cold-Chain
                  </span>
                  <p className="mt-1 text-base font-extrabold">
                    {selectedBranchRow.latestTempC !== null
                      ? `${selectedBranchRow.latestTempC}°C`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Branch Clinical Cases */}
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-[#118AB2]">
                  Active &amp; Recent Clinical Cases ({selectedBranchRow.drillDown?.cases?.length || 0})
                </h3>
                <div className="mt-2 space-y-2">
                  {(selectedBranchRow.drillDown?.cases || []).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-[#DDDCD4] p-3"
                    >
                      <div>
                        <p className="font-extrabold">
                          {c.case_number} • {c.patient?.full_name || 'Patient'}
                        </p>
                        <p className="text-[11px] opacity-75">
                          Cat {c.exposure_category || 'II'} • {c.wound_site} • {c.regimen_type}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#118AB2]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#118AB2]">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branch FEFO Inventory Batches */}
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-[#118AB2]">
                  Live FEFO Inventory Batches
                </h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(selectedBranchRow.drillDown?.inventoryBatches || []).map((inv) => (
                    <div
                      key={inv.id}
                      className="rounded-xl border border-[#DDDCD4] p-3"
                    >
                      <p className="font-extrabold">{inv.item_name}</p>
                      <p className="font-mono text-[11px] opacity-80">
                        Lot {inv.batch_number} • Exp: {inv.expiry_date}
                      </p>
                      <p className="mt-1 font-extrabold text-[#118AB2]">
                        {inv.stock_vials} vials remaining
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branch Assigned Staff */}
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-[#118AB2]">
                  Assigned Clinic Staff
                </h3>
                <div className="mt-2 space-y-1.5">
                  {(selectedBranchRow.drillDown?.staff || []).length === 0 ? (
                    <p className="opacity-70">No branch-specific staff rows filtered.</p>
                  ) : (
                    (selectedBranchRow.drillDown?.staff || []).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-[#DDDCD4] px-3 py-2"
                      >
                        <span className="font-bold">
                          {s.full_name} ({s.role.toUpperCase()})
                        </span>
                        <span className="font-mono text-[11px] font-extrabold text-[#118AB2]">
                          {s.prc_license_number || s.license_number}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NETWORK MISSED FOLLOW-UPS MODAL */}
      {missedDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Network Missed Follow-Ups"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DDDCD4] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-red-600">
                  Network Missed Follow-Ups &amp; Cat III Defaulters
                </h2>
                <p className="text-xs opacity-75">
                  Risk-stratified across all 7 official branches.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMissedDrawerOpen(false)}
                className="rounded-xl border border-[#DDDCD4] p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-xs">
              {(kpi.missedFollowUps?.items || []).length === 0 ? (
                <p className="py-6 text-center font-bold opacity-75">
                  No missed follow-ups recorded across the network today.
                </p>
              ) : (
                (kpi.missedFollowUps?.items || []).map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-red-200 bg-red-50/70 p-3.5 text-red-950"
                  >
                    <div>
                      <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                        Cat {m.exposure_category} • Day {m.dose_day}
                      </span>
                      <p className="mt-1 font-extrabold">
                        {m.patient?.full_name || 'Patient'} ({m.case_number})
                      </p>
                      <p className="text-[11px]">
                        {m.branch_name} • Wound: {m.wound_site} • Phone:{' '}
                        {m.patient?.phone || 'N/A'}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-red-700">
                      Due: {m.scheduled_date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* STAFF GOVERNANCE MODAL */}
      {staffModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Staff Credential & Branch Assignment"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DDDCD4] pb-3">
              <h2 className="text-base font-extrabold">
                {editingStaff ? 'Update Staff Governance' : 'Provision Staff Account'}
              </h2>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="rounded-xl border border-[#DDDCD4] p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStaffSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold">Full Name &amp; Title</label>
                <input
                  type="text"
                  required
                  value={staffForm.full_name}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, full_name: e.target.value })
                  }
                  placeholder="Dr. Maria Santos, MD"
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                />
              </div>

              {!editingStaff && (
                <>
                  <div>
                    <label className="block font-extrabold">Official Email</label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, email: e.target.value })
                      }
                      placeholder="staff@victorioabc.ph"
                      className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold">Initial Password</label>
                    <input
                      type="text"
                      required
                      value={staffForm.password}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, password: e.target.value })
                      }
                      className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-mono font-semibold"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold">Clinical Role</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, role: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                  >
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold">Assigned Branch</label>
                  <select
                    disabled={staffForm.role === 'admin'}
                    value={staffForm.branch_id}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, branch_id: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold disabled:opacity-50"
                  >
                    {OFFICIAL_BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold">PRC License Number</label>
                  <input
                    type="text"
                    value={staffForm.prc_license_number}
                    onChange={(e) =>
                      setStaffForm({
                        ...staffForm,
                        prc_license_number: e.target.value,
                      })
                    }
                    placeholder="PRC-0148291"
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold">PRC Expiry Date</label>
                  <input
                    type="date"
                    value={staffForm.prc_expiry_date}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, prc_expiry_date: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 font-extrabold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffSubmitting}
                  className="min-h-[42px] rounded-xl bg-[#118AB2] px-5 py-2 font-extrabold text-white hover:bg-[#0D6E8E] disabled:opacity-60"
                >
                  {staffSubmitting ? 'Saving...' : 'Save Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;

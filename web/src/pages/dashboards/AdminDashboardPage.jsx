import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ShieldCheck,
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
  Power,
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

export function AdminDashboardPage() {
  const outletCtx = useOutletContext() || {};
  const isDark = Boolean(outletCtx.isDark);
  const rawTab = outletCtx.activeTab || 'matrix';
  const activeTab =
    rawTab === 'predictive' || rawTab === 'yield' ? 'inventory' : rawTab;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Drill-down drawer state for 7-Branch Comparison Matrix
  const [selectedBranchRow, setSelectedBranchRow] = useState(null);
  const [missedDrawerOpen, setMissedDrawerOpen] = useState(false);

  // Rebalance execution & manual transfer modal state
  const [transferringId, setTransferringId] = useState(null);
  const [manualTransferOpen, setManualTransferOpen] = useState(false);
  const [manualTransferForm, setManualTransferForm] = useState({
    from_branch_id: 'pandi',
    to_branch_id: 'santa-maria',
    vials_count: 10,
    reason: 'Proactive FEFO inter-branch stock balancing ordered by Super Admin.',
  });

  // Staff Governance modals
  const [staffBranchFilter, setStaffBranchFilter] = useState('all');
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [togglingStaffId, setTogglingStaffId] = useState(null);
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
        `Transfer executed in Supabase: ${rec.recommended_vials} FEFO vials (${rec.batch_number}) moved from ${rec.from_branch_name} to ${rec.to_branch_name}.`
      );
      await fetchCommandCenter();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to execute rebalance transfer.');
    } finally {
      setTransferringId(null);
    }
  };

  const handleManualTransferSubmit = async (e) => {
    e.preventDefault();
    if (manualTransferForm.from_branch_id === manualTransferForm.to_branch_id) {
      setError('Source and destination branches must be different.');
      return;
    }
    setTransferringId('manual');
    setNotice(null);
    try {
      await api.post('/admin/rebalance-transfer', {
        from_branch_id: manualTransferForm.from_branch_id,
        to_branch_id: manualTransferForm.to_branch_id,
        vials_count: Number(manualTransferForm.vials_count) || 10,
        reason: manualTransferForm.reason,
      });
      setNotice(
        `Transferred ${manualTransferForm.vials_count} PVRV vials from ${manualTransferForm.from_branch_id} to ${manualTransferForm.to_branch_id}.`
      );
      setManualTransferOpen(false);
      await fetchCommandCenter();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to execute inter-branch transfer.');
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

  const handleToggleStaffActive = async (member) => {
    setTogglingStaffId(member.id);
    setNotice(null);
    try {
      const nextActive = member.is_active === false;
      await api.patch(`/admin/staff/${member.id}`, {
        is_active: nextActive,
      });
      setNotice(
        `${member.full_name} account ${nextActive ? 'activated' : 'deactivated'} in Supabase.`
      );
      await fetchCommandCenter();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to toggle staff active status.');
    } finally {
      setTogglingStaffId(null);
    }
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
        setNotice(`Saved branch & PRC governance for ${staffForm.full_name}.`);
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
        setNotice(
          `Provisioned new ${staffForm.role.toUpperCase()} account for ${staffForm.full_name}.`
        );
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
      {/* Status Toast Notifications */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400 bg-emerald-50 px-4 py-3 text-xs font-extrabold text-emerald-950 shadow-xs"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{notice}</span>
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded-lg p-1 hover:bg-emerald-200/60"
            aria-label="Dismiss notice"
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

      {/* =====================================================================
          VIEW 1: OVERVIEW & 7-BRANCH MATRIX (`activeTab === 'matrix'`)
         ===================================================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#118AB2]/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#118AB2]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Owner Overview • All 7 Official Branches</span>
              </div>
              <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
                Network KPIs &amp; 7-Branch Operational Matrix
              </h1>
              <p className="text-xs opacity-75">
                Click any branch row to inspect its live cases, FEFO vaccine stock, cold-chain history, and assigned staff.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchCommandCenter}
              disabled={loading}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#0D6E8E] disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Live Data</span>
            </button>
          </div>

          {/* 5-Card Network KPI Strip */}
          <section
            aria-label="Network-Wide KPI Strip"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
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
                <span>GCash: {formatPhp(kpi.revenueByMethod?.gcash_maya)}</span>
                <span>Card: {formatPhp(kpi.revenueByMethod?.card)}</span>
                <span>HMO: {formatPhp(kpi.revenueByMethod?.hmo)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-75">
                  Patients Treated
                </span>
                <Users className="h-4 w-4 text-[#118AB2]" />
              </div>
              <p className="mt-2 text-2xl font-extrabold">
                {kpi.totalPatientsTreated?.total ?? 0}
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#DDDCD4]/60 pt-2 text-[11px] font-bold">
                <span className="text-[#118AB2]">
                  New: {kpi.totalPatientsTreated?.newCases ?? 0}
                </span>
                <span className="text-emerald-600">
                  Boosters: {kpi.totalPatientsTreated?.scheduledBoosters ?? 0}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-red-400/70 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                  Missed Follow-Ups
                </span>
                <PhoneMissed className="h-4 w-4 text-red-600" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-extrabold text-red-600">
                  {kpi.missedFollowUps?.count ?? 0}
                </p>
                <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                  {kpi.missedFollowUps?.cat3Count ?? 0} Cat III
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

            <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-75">
                  PhilHealth ABTP
                </span>
                <FileSpreadsheet className="h-4 w-4 text-[#118AB2]" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-[#118AB2]">
                {formatPhp(kpi.pendingPhilhealthAbtp?.amountPhp)}
              </p>
              <p className="mt-2.5 border-t border-[#DDDCD4]/60 pt-2 text-[11px] font-bold opacity-80">
                {kpi.pendingPhilhealthAbtp?.claimsCount ?? 0} PRC-Validated Claims
              </p>
            </div>

            <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-75">
                  System Alerts
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
                  {kpi.activeSystemAlerts?.lowStockBranches ?? 0} Stockout
                </span>
              </div>
            </div>
          </section>

          {/* 7-Branch Comparison Matrix Table */}
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <div>
                <h2 className="text-lg font-extrabold">
                  7-Branch Operational Comparison Matrix
                </h2>
                <p className="text-xs opacity-75">
                  Click any row or &ldquo;Inspect Branch&rdquo; to open its live operational detail drawer.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDDCD4] bg-[#F2F2ED] text-[11px] font-extrabold uppercase tracking-wider">
                    <th className="rounded-tl-xl px-4 py-3">Official Branch</th>
                    <th className="px-4 py-3">Daily Sales</th>
                    <th className="px-4 py-3">Patients (New / Booster)</th>
                    <th className="px-4 py-3">PVRV Vials Left</th>
                    <th className="px-4 py-3">ERIG / HRIG Left</th>
                    <th className="px-4 py-3">Cold-Chain (°C)</th>
                    <th className="px-4 py-3">Vial Wastage</th>
                    <th className="px-4 py-3">Audit Status</th>
                    <th className="rounded-tr-xl px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDDCD4]/70">
                  {branchMatrix.map((row) => (
                    <tr
                      key={row.branch_id}
                      onClick={() => setSelectedBranchRow(row)}
                      className="cursor-pointer transition hover:bg-[#118AB2]/5"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-extrabold">{row.short_name}</p>
                        <p className="text-[11px] opacity-70">{row.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-emerald-600">
                        {formatPhp(row.dailySalesPhp)}
                      </td>
                      <td className="px-4 py-3.5 font-bold">
                        <span className="text-[#118AB2]">{row.newCasesCount} New</span>
                        <span className="mx-1.5 opacity-40">/</span>
                        <span className="text-emerald-600">
                          {row.boosterCount} Boosters
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
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
                      <td className="px-4 py-3.5 font-extrabold">
                        {row.erigHrigLeft} vials
                      </td>
                      <td className="px-4 py-3.5">
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
                      <td className="px-4 py-3.5 font-extrabold">
                        {row.openVialWastageRatePct}%
                      </td>
                      <td className="px-4 py-3.5">
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
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBranchRow(row);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#118AB2]/10 px-3 py-1.5 text-[11px] font-extrabold text-[#118AB2] hover:bg-[#118AB2] hover:text-white"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect Branch</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: INVENTORY & TRANSFERS (`activeTab === 'inventory'`)
         ===================================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <div>
              <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-[11px] font-extrabold uppercase text-[#118AB2]">
                14-Day Stockout &amp; Vial Yield Intelligence
              </span>
              <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
                Predictive FEFO Rebalancing &amp; Multi-Dose Vial Yield
              </h1>
              <p className="text-xs opacity-75">
                Calculates 14-day burn rates from scheduled Day 3, 7, 14, and 28 boosters and executes live inter-branch vial transfers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setManualTransferOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>New Inter-Branch Transfer</span>
              </button>
              <button
                type="button"
                onClick={fetchCommandCenter}
                disabled={loading}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-4 py-2.5 text-xs font-extrabold"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Recommended Inter-Branch Rebalancing Cards */}
          <section className="rounded-3xl border-2 border-[#118AB2] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold">
              Recommended Inter-Branch FEFO Vial Transfers
            </h2>
            <p className="text-xs opacity-75">
              One-click approval deducts vials from the donor branch, increments the recipient branch in Supabase, and writes an immutable audit log.
            </p>

            {predictive.recommendations.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[#DDDCD4] p-6 text-center text-xs font-bold opacity-75">
                All 7 branches currently exceed their 14-day projected booster demand. Use &ldquo;New Inter-Branch Transfer&rdquo; above for custom transfers.
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                            ? 'Transferring in Supabase...'
                            : `Approve & Transfer ${rec.recommended_vials} Vials`}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Combined 14-Day Burn Rate & Multi-Dose Vial Yield Table */}
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold">
              14-Day Stockout Projection &amp; Multi-Dose Vial Yield by Branch
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDDCD4] bg-[#F2F2ED] text-[11px] font-extrabold uppercase">
                    <th className="px-3.5 py-3">Branch</th>
                    <th className="px-3.5 py-3">PVRV Vials</th>
                    <th className="px-3.5 py-3">14d Scheduled Boosters</th>
                    <th className="px-3.5 py-3">Est. Days Left</th>
                    <th className="px-3.5 py-3">Near-Expiry (&le;60d)</th>
                    <th className="px-3.5 py-3">Reconstituted ID Doses</th>
                    <th className="px-3.5 py-3">Vial Yield / Wastage</th>
                    <th className="px-3.5 py-3">Risk Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDDCD4]/70">
                  {predictive.branches.map((b) => {
                    const y =
                      vialYield.branches.find((v) => v.branch_id === b.branch_id) || {};
                    return (
                      <tr key={b.branch_id}>
                        <td className="px-3.5 py-3 font-extrabold">{b.short_name}</td>
                        <td className="px-3.5 py-3 font-extrabold">
                          {b.pvrvVialsLeft} vials
                        </td>
                        <td className="px-3.5 py-3 font-bold text-[#118AB2]">
                          {b.scheduledBoosters14d} doses
                        </td>
                        <td className="px-3.5 py-3 font-extrabold">
                          {b.estimatedDaysUntilStockout} days
                        </td>
                        <td className="px-3.5 py-3 font-bold text-amber-600">
                          {b.nearExpiryVialsCount} vials
                        </td>
                        <td className="px-3.5 py-3 font-bold">
                          {y.administeredDoses ?? 0} used / {y.totalDosesCapacity ?? 0} cap
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="font-extrabold text-emerald-600">
                            {y.yieldRatePct ?? 100}% yield
                          </span>
                          <span className="ml-1.5 text-[11px] text-red-600">
                            ({y.wastageRatePct ?? 0}% waste)
                          </span>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: STAFF & PRC GOVERNANCE (`activeTab === 'staff'`)
         ===================================================================== */}
      {activeTab === 'staff' && (
        <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
            <div>
              <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-[11px] font-extrabold uppercase text-[#118AB2]">
                Staff &amp; Credential Governance
              </span>
              <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
                Branch Assignments &amp; PRC License Expiration Monitor
              </h1>
              <p className="text-xs opacity-75">
                Assign Doctors and Nurses to locked branches and update PRC license numbers and expiration dates in Supabase.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={staffBranchFilter}
                onChange={(e) => setStaffBranchFilter(e.target.value)}
                aria-label="Filter staff by branch"
                className="min-h-[44px] rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold"
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
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
              >
                <Plus className="h-4 w-4" />
                <span>Provision Staff Account</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#DDDCD4] bg-[#F2F2ED] text-[11px] font-extrabold uppercase">
                  <th className="px-3.5 py-3">Staff Member</th>
                  <th className="px-3.5 py-3">Role</th>
                  <th className="px-3.5 py-3">Locked Branch Assignment</th>
                  <th className="px-3.5 py-3">PRC License No.</th>
                  <th className="px-3.5 py-3">PRC Expiry Date</th>
                  <th className="px-3.5 py-3">PRC Status</th>
                  <th className="px-3.5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDCD4]/70">
                {filteredStaff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-3.5 py-3.5">
                      <p className="font-extrabold">{member.full_name}</p>
                      <p className="font-mono text-[11px] opacity-75">{member.email}</p>
                    </td>
                    <td className="px-3.5 py-3.5">
                      <span className="rounded-full bg-[#118AB2]/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-[#118AB2]">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 font-bold">
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-3 w-3 text-[#118AB2]" />
                        <span>{member.branch_name}</span>
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 font-mono font-extrabold">
                      {member.prc_license_number || '—'}
                    </td>
                    <td className="px-3.5 py-3.5 font-bold">
                      {member.prc_expiry_date || '—'}
                    </td>
                    <td className="px-3.5 py-3.5">
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
                    <td className="px-3.5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditStaffModal(member)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#DDDCD4] px-3 py-1.5 text-[11px] font-extrabold hover:border-[#118AB2]"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit / Reassign</span>
                        </button>
                        {member.role !== 'admin' && (
                          <button
                            type="button"
                            disabled={togglingStaffId === member.id}
                            onClick={() => handleToggleStaffActive(member)}
                            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-extrabold ${
                              member.is_active !== false
                                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            <span>
                              {member.is_active !== false ? 'Deactivate' : 'Activate'}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =====================================================================
          VIEW 4: IMMUTABLE AUDIT LOG (`activeTab === 'audit'`)
         ===================================================================== */}
      {activeTab === 'audit' && (
        <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
            <div>
              <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-[11px] font-extrabold uppercase text-[#118AB2]">
                Compliance &amp; Governance Ledger
              </span>
              <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
                Immutable Sensitive Action Audit Log
              </h1>
              <p className="text-xs opacity-75">
                Live append-only record of AI overrides, electronic PRC sign-offs, cold-chain breaches, and inter-branch stock transfers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                aria-label="Filter audit log by action type"
                className="min-h-[44px] rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold"
              >
                {actionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'ALL' ? 'All Sensitive Actions' : type}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={fetchCommandCenter}
                disabled={loading}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleExportAuditCsv}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#464B71] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#343857]"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
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
                  Branch Operational Drill-Down
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
                aria-label="Close branch drill-down"
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

      {/* MANUAL INTER-BRANCH TRANSFER MODAL */}
      {manualTransferOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Execute Inter-Branch FEFO Vial Transfer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DDDCD4] pb-3">
              <h2 className="text-base font-extrabold">
                Execute Inter-Branch PVRV Vial Transfer
              </h2>
              <button
                type="button"
                onClick={() => setManualTransferOpen(false)}
                className="rounded-xl border border-[#DDDCD4] p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleManualTransferSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold">From Donor Branch</label>
                  <select
                    value={manualTransferForm.from_branch_id}
                    onChange={(e) =>
                      setManualTransferForm({
                        ...manualTransferForm,
                        from_branch_id: e.target.value,
                      })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                  >
                    {OFFICIAL_BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.shortName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-extrabold">To Recipient Branch</label>
                  <select
                    value={manualTransferForm.to_branch_id}
                    onChange={(e) =>
                      setManualTransferForm({
                        ...manualTransferForm,
                        to_branch_id: e.target.value,
                      })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                  >
                    {OFFICIAL_BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.shortName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-extrabold">Vials to Transfer (FEFO)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={manualTransferForm.vials_count}
                  onChange={(e) =>
                    setManualTransferForm({
                      ...manualTransferForm,
                      vials_count: e.target.value,
                    })
                  }
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                />
              </div>

              <div>
                <label className="block font-extrabold">Transfer Audit Reason</label>
                <textarea
                  rows={2}
                  required
                  value={manualTransferForm.reason}
                  onChange={(e) =>
                    setManualTransferForm({
                      ...manualTransferForm,
                      reason: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-[#DDDCD4] p-3 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualTransferOpen(false)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 font-extrabold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferringId === 'manual'}
                  className="min-h-[42px] rounded-xl bg-[#118AB2] px-5 py-2 font-extrabold text-white hover:bg-[#0D6E8E]"
                >
                  {transferringId === 'manual' ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
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

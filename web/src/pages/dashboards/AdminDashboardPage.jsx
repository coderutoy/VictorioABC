import { useMemo, useState } from 'react';
import {
  Users,
  Activity,
  PackageX,
  UserCheck,
  Building2,
  Syringe,
  Plus,
  Minus,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CalendarClock,
  Download,
  UserPlus,
  Power,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { OFFICIAL_BRANCHES } from '../../config/branches';
import { useClinicalBranchData } from '../../hooks/useClinicalBranchData';
import {
  DashboardHero,
  KpiCard,
  Panel,
  TableWrap,
  Th,
  Td,
  EmptyState,
  StatusPill,
} from '../../components/dashboard/DashboardWidgets';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

const DEFAULT_BATCH_FORM = {
  id: '',
  item_name: 'Verorab PVRV',
  category: 'vaccine',
  batch_number: '',
  stock_vials: 50,
  reorder_level: 12,
  expiry_date: '2027-12-31',
};

const DEFAULT_STAFF_FORM = {
  id: '',
  full_name: '',
  email: '',
  password: 'VictorioABC@2026',
  role: 'nurse',
  branch_id: 'santa-maria',
  license_number: '',
  is_active: true,
};

const CASE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'queued_nurse', label: 'Queued' },
  { id: 'pending_doctor', label: 'Pending Doctor' },
  { id: 'active_pep', label: 'Active PEP' },
  { id: 'completed', label: 'Completed' },
];

export function AdminDashboardPage() {
  const { profile } = useAuth();
  const { activeBranch } = useBranch();
  const branchId = activeBranch?.id || 'santa-maria';

  const {
    summary,
    staff,
    allStaff,
    inventory,
    cases,
    loading,
    error: dataError,
    refresh,
    createStaffAccount,
    updateStaffAccount,
    addInventoryBatch,
    updateInventoryBatch,
    deleteInventoryBatch,
  } = useClinicalBranchData(branchId, { isAdmin: true });

  const [activeTab, setActiveTab] = useState('inventory'); // 'staff' | 'inventory' | 'cases'
  const [showAllBranchesStaff, setShowAllBranchesStaff] = useState(false);
  const [caseStatusFilter, setCaseStatusFilter] = useState('all');

  // Feedback state
  const [banner, setBanner] = useState('');
  const [actionError, setActionError] = useState('');

  // Inventory Batch Modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchForm, setBatchForm] = useState(DEFAULT_BATCH_FORM);
  const [savingBatch, setSavingBatch] = useState(false);
  const [busyBatchId, setBusyBatchId] = useState(null);

  // Staff Modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState(DEFAULT_STAFF_FORM);
  const [savingStaff, setSavingStaff] = useState(false);
  const [busyStaffId, setBusyStaffId] = useState(null);

  const displayedStaff = showAllBranchesStaff ? allStaff : staff;

  const filteredCases = useMemo(() => {
    if (caseStatusFilter === 'all') return cases;
    return cases.filter((c) => c.status === caseStatusFilter);
  }, [cases, caseStatusFilter]);

  const openAddBatchModal = () => {
    setActionError('');
    setBatchForm({
      ...DEFAULT_BATCH_FORM,
      batch_number: `VRB-2026-${branchId.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
    });
    setBatchModalOpen(true);
  };

  const openEditBatchModal = (row) => {
    setActionError('');
    setBatchForm({
      id: row.id,
      item_name: row.item_name,
      category: row.category || 'vaccine',
      batch_number: row.batch_number || '',
      stock_vials: row.stock_vials ?? 0,
      reorder_level: row.reorder_level ?? 10,
      expiry_date: row.expiry_date || '2027-12-31',
    });
    setBatchModalOpen(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    setSavingBatch(true);
    setActionError('');
    try {
      if (batchForm.id) {
        await updateInventoryBatch(batchForm.id, batchForm);
        setBanner(`Updated batch ${batchForm.item_name} (${batchForm.stock_vials} vials).`);
      } else {
        await addInventoryBatch(batchForm);
        setBanner(`Added new batch ${batchForm.item_name} (${batchForm.stock_vials} vials).`);
      }
      setBatchModalOpen(false);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to save inventory batch.');
    } finally {
      setSavingBatch(false);
    }
  };

  const handleQuickAdjustVials = async (row, delta) => {
    setBusyBatchId(row.id);
    setActionError('');
    try {
      const updated = await updateInventoryBatch(row.id, { delta });
      setBanner(
        `Adjusted ${row.item_name} (${row.batch_number}) to ${updated?.stock_vials} vials.`
      );
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to adjust stock vials.');
    } finally {
      setBusyBatchId(null);
    }
  };

  const handleDeleteBatch = async (row) => {
    setBusyBatchId(row.id);
    setActionError('');
    try {
      await deleteInventoryBatch(row.id);
      setBanner(`Deleted inventory batch ${row.item_name} (${row.batch_number}).`);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to delete inventory batch.');
    } finally {
      setBusyBatchId(null);
    }
  };

  const openAddStaffModal = () => {
    setActionError('');
    setStaffForm({
      ...DEFAULT_STAFF_FORM,
      branch_id: branchId,
    });
    setStaffModalOpen(true);
  };

  const openEditStaffModal = (s) => {
    setActionError('');
    setStaffForm({
      id: s.id,
      full_name: s.full_name || '',
      email: s.email || '',
      password: '',
      role: s.role || 'nurse',
      branch_id: s.branch_id || branchId,
      license_number: s.license_number || '',
      is_active: s.is_active !== false,
    });
    setStaffModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setSavingStaff(true);
    setActionError('');
    try {
      if (staffForm.id) {
        await updateStaffAccount(staffForm.id, {
          full_name: staffForm.full_name,
          role: staffForm.role,
          branch_id: staffForm.role === 'admin' ? null : staffForm.branch_id,
          license_number: staffForm.license_number,
          is_active: staffForm.is_active,
        });
        setBanner(`Updated staff profile for ${staffForm.full_name}.`);
      } else {
        await createStaffAccount({
          full_name: staffForm.full_name,
          email: staffForm.email,
          password: staffForm.password || 'VictorioABC@2026',
          role: staffForm.role,
          branch_id: staffForm.role === 'admin' ? null : staffForm.branch_id,
          license_number: staffForm.license_number,
        });
        setBanner(`Created new staff login account for ${staffForm.full_name} (${staffForm.email}).`);
      }
      setStaffModalOpen(false);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to save staff account.');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleToggleStaffActive = async (s) => {
    setBusyStaffId(s.id);
    setActionError('');
    try {
      const nextActive = s.is_active === false;
      await updateStaffAccount(s.id, { is_active: nextActive });
      setBanner(
        `${nextActive ? 'Activated' : 'Deactivated'} account for ${s.full_name}.`
      );
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to toggle staff status.');
    } finally {
      setBusyStaffId(null);
    }
  };

  const handleExportCasesCsv = () => {
    const headers = [
      'Case Number',
      'Branch ID',
      'Patient Code',
      'Animal Type',
      'WHO Exposure Category',
      'Wound Site',
      'Exposure Date',
      'Status',
      'ERIG Required',
      'Tetanus Given',
    ];
    const rows = filteredCases.map((c) => [
      c.case_number || '',
      c.branch_id || branchId,
      c.patient?.patient_code || '',
      c.animal_type || '',
      c.exposure_category || 'Pending',
      `"${String(c.wound_site || '').replace(/"/g, '""')}"`,
      c.exposure_date || '',
      c.status || '',
      c.erig_required ? 'Yes' : 'No',
      c.tetanus_given ? 'Yes' : 'No',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `victorio-abc-${branchId}-cases-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBanner(`Exported ${filteredCases.length} case records to CSV.`);
  };

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Global & Branch Administration"
        icon={Building2}
        title={`Welcome, ${profile?.full_name || 'Clinic Administrator'}`}
        subtitle="Manage branch staff accounts, vaccine & ERIG inventory batches, and clinical case reports across all 7 branches."
        branchLabel={activeBranch?.name || 'Victorio ABC — Santa Maria, Bulacan'}
        branchAddress={activeBranch?.address}
      >
        <button
          type="button"
          onClick={refresh}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-white/25"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Live Data</span>
        </button>
        <button
          type="button"
          onClick={openAddStaffModal}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white text-[#464B71] px-4 py-2 text-xs font-extrabold transition hover:bg-[#F2F2ED]"
        >
          <UserPlus className="h-4 w-4 text-[#118AB2]" />
          <span>+ Add Staff</span>
        </button>
        <button
          type="button"
          data-testid="admin-open-stock-modal-btn"
          onClick={openAddBatchModal}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-4 py-2 text-xs font-extrabold text-[#464B71] transition hover:bg-[#68c7b8]"
        >
          <Plus className="h-4 w-4" />
          <span>+ Add Vaccine Batch</span>
        </button>
      </DashboardHero>

      {banner && (
        <div className="flex items-center justify-between rounded-2xl border border-[#7CD5C7] bg-[#EAFBF8] px-4 py-3 text-xs font-extrabold text-[#464B71]">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{banner}</span>
          </span>
          <button
            type="button"
            onClick={() => setBanner('')}
            aria-label="Dismiss notification"
            className="rounded-lg p-1 hover:bg-[#7CD5C7]/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {(actionError || dataError) && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 text-xs font-extrabold text-red-800"
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>{actionError || dataError}</span>
          </span>
          <button
            type="button"
            onClick={() => setActionError('')}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 5 Live Branch Overview KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Total Patients"
          icon={Users}
          tone="blue"
          value={summary.totalPatients}
          hint={`Encrypted patients in ${activeBranch?.shortName || branchId}`}
          loading={loading}
        />
        <KpiCard
          label="Active PEP Cases"
          icon={Activity}
          tone="mint"
          value={summary.activeCases}
          hint="Currently undergoing Day 0–28 PEP"
          loading={loading}
        />
        <KpiCard
          label="Today's Due Doses"
          icon={CalendarClock}
          tone="blue"
          value={summary.todayDueDoses}
          hint="Scheduled PEP doses due today"
          loading={loading}
        />
        <KpiCard
          label="Low-Stock Alerts"
          icon={PackageX}
          tone="amber"
          value={summary.lowStockCount}
          hint="Batches at or below reorder level"
          loading={loading}
        />
        <KpiCard
          label="Active Staff"
          icon={UserCheck}
          tone="navy"
          value={summary.activeStaffCount}
          hint="Active clinicians & admin on duty"
          loading={loading}
        />
      </div>

      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label="Admin dashboard sections"
        className="flex flex-wrap items-center gap-2 border-b border-[#DDDCD4] pb-3"
      >
        {[
          {
            id: 'inventory',
            label: `Vaccine & Biologics Inventory (${inventory.length})`,
            icon: Syringe,
          },
          {
            id: 'staff',
            label: `Staff Management (${displayedStaff.length})`,
            icon: UserCheck,
          },
          {
            id: 'cases',
            label: `Cases & Reports (${cases.length})`,
            icon: Activity,
          },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(id)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition sm:text-sm ${
                isActive
                  ? 'bg-[#464B71] text-[#7CD5C7] shadow-sm'
                  : 'bg-white text-[#464B71] hover:bg-[#DDDCD4]/60'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Vaccine & Biologics Inventory */}
      {activeTab === 'inventory' && (
        <Panel
          title={`Vaccine & Biologics Inventory — ${activeBranch?.shortName || branchId}`}
          subtitle="Live stock vials, quick restock (+/-), batch editing, and low-stock/expiry alerts"
          action={
            <button
              type="button"
              onClick={openAddBatchModal}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#0D6E8E]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Batch</span>
            </button>
          }
        >
          {inventory.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No vaccine inventory batches found for this branch. Click 'Add Batch' above."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Item Name</Th>
                  <Th>Category</Th>
                  <Th>Batch Number</Th>
                  <Th>Stock Vials</Th>
                  <Th>Quick Restock / Adjust</Th>
                  <Th>Reorder Level</Th>
                  <Th>Expiry Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {inventory.map((row) => {
                  const days = daysUntil(row.expiry_date);
                  const isLow = Number(row.stock_vials) <= Number(row.reorder_level);
                  const isBusy = busyBatchId === row.id;
                  return (
                    <tr key={row.id}>
                      <Td className="font-extrabold">{row.item_name}</Td>
                      <Td className="uppercase">{row.category}</Td>
                      <Td className="font-mono text-xs">{row.batch_number || '—'}</Td>
                      <Td className="font-extrabold text-[#118AB2]">
                        {row.stock_vials} vials
                      </Td>
                      <Td>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isBusy || Number(row.stock_vials) <= 0}
                            onClick={() => handleQuickAdjustVials(row, -1)}
                            title="Deduct 1 vial"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DDDCD4] bg-[#F2F2ED] text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4] disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleQuickAdjustVials(row, 1)}
                            title="Add 1 vial"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DDDCD4] bg-[#F2F2ED] text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4] disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleQuickAdjustVials(row, 10)}
                            className="inline-flex h-8 items-center justify-center rounded-lg bg-[#7CD5C7]/35 px-2 text-[11px] font-extrabold text-[#464B71] hover:bg-[#7CD5C7]/60 disabled:opacity-40"
                          >
                            +10
                          </button>
                        </div>
                      </Td>
                      <Td>{row.reorder_level}</Td>
                      <Td className="whitespace-nowrap">{row.expiry_date || '—'}</Td>
                      <Td>
                        {days !== null && days < 0 ? (
                          <StatusPill tone="red">Expired</StatusPill>
                        ) : isLow ? (
                          <StatusPill tone="amber">Low Stock</StatusPill>
                        ) : (
                          <StatusPill tone="green">In Stock</StatusPill>
                        )}
                      </Td>
                      <Td>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditBatchModal(row)}
                            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#DDDCD4] bg-white px-2.5 py-1 text-xs font-extrabold text-[#464B71] hover:bg-[#F2F2ED]"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-[#118AB2]" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDeleteBatch(row)}
                            aria-label={`Delete batch ${row.batch_number}`}
                            className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      )}

      {/* TAB 2: Staff Management */}
      {activeTab === 'staff' && (
        <Panel
          title="Staff & Role Management"
          subtitle={
            showAllBranchesStaff
              ? 'Showing all clinical staff across all 7 Victorio ABC branches'
              : `Showing staff assigned to ${activeBranch?.shortName || branchId} (plus global admins)`
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllBranchesStaff((prev) => !prev)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3.5 py-2 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
              >
                <span>
                  {showAllBranchesStaff ? 'Filter by Active Branch' : 'View All Branches'}
                </span>
              </button>
              <button
                type="button"
                onClick={openAddStaffModal}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Add Staff Account</span>
              </button>
            </div>
          }
        >
          {displayedStaff.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No staff accounts found for this filter."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Full Name</Th>
                  <Th>Role</Th>
                  <Th>Email</Th>
                  <Th>Assigned Branch</Th>
                  <Th>PRC License</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {displayedStaff.map((s) => {
                  const isBusy = busyStaffId === s.id;
                  return (
                    <tr key={s.id}>
                      <Td className="font-extrabold">{s.full_name}</Td>
                      <Td className="capitalize font-semibold">{s.role}</Td>
                      <Td>{s.email}</Td>
                      <Td>
                        {s.branch_id ? (
                          <StatusPill tone="blue">{s.branch_id}</StatusPill>
                        ) : (
                          <StatusPill tone="navy">Global (All Branches)</StatusPill>
                        )}
                      </Td>
                      <Td className="font-mono text-xs">{s.license_number || '—'}</Td>
                      <Td>
                        <StatusPill tone={s.is_active === false ? 'red' : 'green'}>
                          {s.is_active === false ? 'Inactive' : 'Active'}
                        </StatusPill>
                      </Td>
                      <Td>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditStaffModal(s)}
                            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#DDDCD4] bg-white px-2.5 py-1 text-xs font-extrabold text-[#464B71] hover:bg-[#F2F2ED]"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-[#118AB2]" />
                            <span>Edit / Reassign</span>
                          </button>
                          <button
                            type="button"
                            disabled={isBusy || s.id === profile?.id}
                            onClick={() => handleToggleStaffActive(s)}
                            className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-extrabold disabled:opacity-40 ${
                              s.is_active === false
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            <span>{s.is_active === false ? 'Activate' : 'Deactivate'}</span>
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      )}

      {/* TAB 3: Cases & Reports */}
      {activeTab === 'cases' && (
        <Panel
          title={`Clinical Cases & Branch Reports — ${activeBranch?.shortName || branchId}`}
          subtitle="Filter by workflow status and export non-sensitive branch metrics to CSV"
          action={
            <button
              type="button"
              onClick={handleExportCasesCsv}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV Report</span>
            </button>
          }
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {CASE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCaseStatusFilter(f.id)}
                className={`min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                  caseStatusFilter === f.id
                    ? 'bg-[#464B71] text-[#7CD5C7]'
                    : 'bg-[#F2F2ED] text-[#464B71] hover:bg-[#DDDCD4]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredCases.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No clinical cases match the selected status filter."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Case #</Th>
                  <Th>Patient</Th>
                  <Th>Animal &amp; Wound Site</Th>
                  <Th>Exposure Date</Th>
                  <Th>WHO Category</Th>
                  <Th>ERIG / Tetanus</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {filteredCases.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-mono text-xs font-bold">{c.case_number}</Td>
                    <Td>
                      <p className="font-bold">{c.patient?.full_name || 'Patient'}</p>
                      <p className="font-mono text-[11px] text-[#464B71]/70">
                        {c.patient?.patient_code}
                      </p>
                    </Td>
                    <Td className="capitalize">
                      {c.animal_type} • {c.wound_site}
                    </Td>
                    <Td className="whitespace-nowrap">{c.exposure_date}</Td>
                    <Td>
                      {c.exposure_category ? (
                        <StatusPill
                          tone={c.exposure_category === 'III' ? 'red' : 'amber'}
                        >
                          Category {c.exposure_category}
                        </StatusPill>
                      ) : (
                        <StatusPill tone="navy">Unassessed</StatusPill>
                      )}
                    </Td>
                    <Td className="text-xs">
                      {c.erig_required ? 'ERIG + ' : ''}
                      {c.tetanus_given ? 'Tetanus' : 'None'}
                    </Td>
                    <Td>
                      <StatusPill
                        tone={
                          c.status === 'completed'
                            ? 'green'
                            : c.status === 'active_pep'
                              ? 'blue'
                              : 'amber'
                        }
                      >
                        {c.status}
                      </StatusPill>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      )}

      {/* Modal: Add / Edit Inventory Batch */}
      {batchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add or Edit Vaccine Batch"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#343857]/70 p-4"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#464B71]">
                  {batchForm.id ? 'Edit Inventory Batch' : 'Add Vaccine / Biologics Batch'}
                </h2>
                <p className="text-xs text-[#464B71]/75">
                  Branch: <strong>{activeBranch?.shortName || branchId}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="rounded-xl bg-[#F2F2ED] p-2 text-[#464B71] hover:bg-[#DDDCD4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-extrabold text-[#464B71]">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={batchForm.item_name}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, item_name: e.target.value })
                  }
                  placeholder="e.g. Verorab PVRV, Speeda PVRV, Equirab ERIG"
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3.5 py-2 font-semibold text-[#464B71]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-[#464B71]">Category *</label>
                  <select
                    value={batchForm.category}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, category: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  >
                    <option value="vaccine">Anti-Rabies Vaccine</option>
                    <option value="erig">ERIG / HRIG</option>
                    <option value="tetanus">Tetanus Toxoid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={batchForm.batch_number}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, batch_number: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-mono text-xs font-semibold text-[#464B71]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Stock Vials *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={batchForm.stock_vials}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, stock_vials: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-extrabold text-[#464B71]"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={batchForm.reorder_level}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, reorder_level: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={batchForm.expiry_date}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, expiry_date: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-2.5 py-2 text-xs font-semibold text-[#464B71]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#F2F2ED] pt-3">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 text-xs font-extrabold text-[#464B71]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBatch}
                  className="min-h-[42px] rounded-xl bg-[#118AB2] px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#0D6E8E] disabled:opacity-60"
                >
                  {savingBatch ? 'Saving…' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Staff Account */}
      {staffModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add or Edit Staff Account"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#343857]/70 p-4"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#464B71]">
                  {staffForm.id ? 'Edit / Reassign Staff Account' : 'Create New Staff Account'}
                </h2>
                <p className="text-xs text-[#464B71]/75">
                  {staffForm.id
                    ? 'Update role, assigned branch, or PRC license number.'
                    : 'Provisions a real Supabase Auth login + profiles record.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="rounded-xl bg-[#F2F2ED] p-2 text-[#464B71] hover:bg-[#DDDCD4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-extrabold text-[#464B71]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.full_name}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, full_name: e.target.value })
                  }
                  placeholder="e.g. Nurse Camille Reyes"
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3.5 py-2 font-semibold text-[#464B71]"
                />
              </div>

              {!staffForm.id && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-[#464B71]">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, email: e.target.value })
                      }
                      placeholder="staff@victorioabc.ph"
                      className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold text-[#464B71]">
                      Initial Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffForm.password}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, password: e.target.value })
                      }
                      className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-mono text-xs font-semibold text-[#464B71]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-[#464B71]">Role *</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, role: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  >
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Global Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Assigned Branch
                  </label>
                  <select
                    disabled={staffForm.role === 'admin'}
                    value={staffForm.role === 'admin' ? '' : staffForm.branch_id}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, branch_id: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71] disabled:opacity-50"
                  >
                    {staffForm.role === 'admin' ? (
                      <option value="">Global (All Branches)</option>
                    ) : (
                      OFFICIAL_BRANCHES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.shortName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-[#464B71]">
                  PRC License Number
                </label>
                <input
                  type="text"
                  value={staffForm.license_number}
                  onChange={(e) =>
                    setStaffForm({ ...staffForm, license_number: e.target.value })
                  }
                  placeholder="e.g. PRC-0892341"
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3.5 py-2 font-mono text-xs font-semibold text-[#464B71]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#F2F2ED] pt-3">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 text-xs font-extrabold text-[#464B71]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="min-h-[42px] rounded-xl bg-[#118AB2] px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#0D6E8E] disabled:opacity-60"
                >
                  {savingStaff ? 'Saving…' : staffForm.id ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

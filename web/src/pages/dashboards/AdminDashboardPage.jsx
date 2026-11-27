import { useState } from 'react';
import {
  Users,
  Activity,
  PackageX,
  UserCheck,
  Building2,
  Syringe,
  Plus,
  Edit3,
  X,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
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

const DEFAULT_STOCK_FORM = {
  id: '',
  item_name: 'Verorab PVRV',
  category: 'vaccine',
  batch_number: 'VRB-2026-NEW',
  stock_vials: 50,
  reorder_level: 12,
  expiry_date: '2027-12-31',
};

export function AdminDashboardPage() {
  const { profile } = useAuth();
  const { activeBranch } = useBranch();
  const branchId = activeBranch?.id || profile?.branch_id || 'santa-maria';

  const {
    staff,
    inventory,
    cases,
    doses,
    loading,
    refresh,
    saveVaccineStock,
  } = useClinicalBranchData(branchId);

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockForm, setStockForm] = useState(DEFAULT_STOCK_FORM);
  const [savingStock, setSavingStock] = useState(false);
  const [banner, setBanner] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCasesCount = cases.filter(
    (c) => (c.created_at || '').slice(0, 10) === todayStr || c.exposure_date === todayStr
  ).length;
  const activePepCount = cases.filter((c) =>
    ['queued_nurse', 'pending_doctor', 'active_pep'].includes(c.status)
  ).length;
  const lowStockItems = inventory.filter(
    (row) => Number(row.stock_vials) <= Number(row.reorder_level)
  );
  const activeStaffCount = staff.filter((s) => s.is_active !== false).length;

  const openAddStockModal = () => {
    setStockForm({
      ...DEFAULT_STOCK_FORM,
      batch_number: `VRB-2026-${branchId.slice(0, 3).toUpperCase()}`,
    });
    setStockModalOpen(true);
  };

  const openEditStockModal = (row) => {
    setStockForm({
      id: row.id,
      item_name: row.item_name,
      category: row.category || 'vaccine',
      batch_number: row.batch_number || '',
      stock_vials: row.stock_vials ?? 0,
      reorder_level: row.reorder_level ?? 10,
      expiry_date: row.expiry_date || '2027-12-31',
    });
    setStockModalOpen(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    setSavingStock(true);
    try {
      await saveVaccineStock(stockForm);
      setBanner(
        `Saved vaccine inventory: ${stockForm.item_name} (${stockForm.stock_vials} vials).`
      );
      setStockModalOpen(false);
    } finally {
      setSavingStock(false);
    }
  };

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Branch Administration"
        icon={Building2}
        title={`Welcome, ${profile?.full_name || 'Branch Administrator'}`}
        subtitle="Live branch staff, clinical case activity, PEP dose tracking, and vaccine/ERIG stock management."
        branchLabel={activeBranch?.name || 'Victorio ABC — Santa Maria, Bulacan'}
        branchAddress={activeBranch?.address}
      >
        <button
          type="button"
          onClick={refresh}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-white/25"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Data</span>
        </button>
        <button
          type="button"
          data-testid="admin-open-stock-modal-btn"
          onClick={openAddStockModal}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-4 py-2 text-xs font-extrabold text-[#464B71] transition hover:bg-[#68c7b8]"
        >
          <Plus className="h-4 w-4" />
          <span>Add / Update Vaccine Stock</span>
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

      {/* Branch Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today's Patients"
          icon={Users}
          tone="blue"
          value={todayCasesCount}
          hint="Walk-in cases registered today"
          loading={loading}
        />
        <KpiCard
          label="Active PEP Cases"
          icon={Activity}
          tone="mint"
          value={activePepCount}
          hint="In nurse triage, pending doctor, or active PEP"
          loading={loading}
        />
        <KpiCard
          label="Low-Stock Vaccines"
          icon={PackageX}
          tone="amber"
          value={lowStockItems.length}
          hint="Items at or below reorder level"
          loading={loading}
        />
        <KpiCard
          label="Staff On Duty"
          icon={UserCheck}
          tone="navy"
          value={activeStaffCount}
          hint="Active branch staff accounts"
          loading={loading}
        />
      </div>

      {/* Vaccine & ERIG Inventory Overview with Add/Update Stock Action */}
      <Panel
        title="Vaccine & ERIG Inventory Overview"
        subtitle={`Live stock vials for ${activeBranch?.shortName || branchId} (click Edit Vials to update stock)`}
        action={
          <button
            type="button"
            onClick={openAddStockModal}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#0D6E8E]"
          >
            <Syringe className="h-3.5 w-3.5" />
            <span>+ Add / Update Stock Vials</span>
          </button>
        }
      >
        {inventory.length === 0 ? (
          <EmptyState
            loading={loading}
            message="No vaccine inventory items found for this branch. Click '+ Add / Update Stock Vials' above."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Item Name</Th>
                <Th>Category</Th>
                <Th>Batch Number</Th>
                <Th>Stock Vials</Th>
                <Th>Reorder Level</Th>
                <Th>Expiry Date</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2ED]">
              {inventory.map((row) => {
                const days = daysUntil(row.expiry_date);
                const isLow = Number(row.stock_vials) <= Number(row.reorder_level);
                return (
                  <tr key={row.id || row.item_name}>
                    <Td className="font-extrabold">{row.item_name}</Td>
                    <Td className="uppercase">{row.category}</Td>
                    <Td className="font-mono text-xs">{row.batch_number || '—'}</Td>
                    <Td className="font-extrabold text-[#118AB2]">{row.stock_vials} vials</Td>
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
                      <button
                        type="button"
                        onClick={() => openEditStockModal(row)}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[#DDDCD4] bg-[#F2F2ED] px-2.5 py-1 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-[#118AB2]" />
                        <span>Edit Vials</span>
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Staff & Role Management */}
        <Panel
          title="Staff & Role Management"
          subtitle={`Assigned clinical staff in ${activeBranch?.shortName || branchId}`}
          action={<StatusPill tone="blue">{staff.length} staff</StatusPill>}
        >
          {staff.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No clinical staff assigned to this branch yet."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Full Name</Th>
                  <Th>Role</Th>
                  <Th>Email</Th>
                  <Th>License</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {staff.map((s) => (
                  <tr key={s.id || s.email}>
                    <Td className="font-bold">{s.full_name}</Td>
                    <Td className="capitalize font-semibold">{s.role}</Td>
                    <Td>{s.email}</Td>
                    <Td className="font-mono text-xs">{s.license_number || '—'}</Td>
                    <Td>
                      <StatusPill tone={s.is_active === false ? 'red' : 'green'}>
                        {s.is_active === false ? 'Inactive' : 'Active'}
                      </StatusPill>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        {/* Branch Clinical Cases & PEP Doses Activity */}
        <Panel
          title="Branch Activity & Recent Clinical Cases"
          subtitle={`Clinical cases (${cases.length}) & scheduled/completed PEP doses (${doses.length})`}
          action={<StatusPill tone="navy">{cases.length} cases</StatusPill>}
        >
          {cases.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No clinical cases logged yet for this branch. Walk-in intake cases created by the Nurse will appear here immediately."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Case #</Th>
                  <Th>Patient</Th>
                  <Th>Exposure</Th>
                  <Th>Category</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {cases.slice(0, 10).map((c) => (
                  <tr key={c.id}>
                    <Td className="font-mono text-xs font-bold">{c.case_number}</Td>
                    <Td className="font-bold">{c.patient?.full_name || 'Walk-In Patient'}</Td>
                    <Td className="capitalize">
                      {c.animal_type} • {c.wound_site}
                    </Td>
                    <Td>
                      {c.exposure_category ? (
                        <StatusPill
                          tone={c.exposure_category === 'III' ? 'red' : 'amber'}
                        >
                          Cat {c.exposure_category}
                        </StatusPill>
                      ) : (
                        'Pending'
                      )}
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
      </div>

      {/* Add / Update Vaccine Stock Modal */}
      {stockModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add or Update Vaccine Stock Vials"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#343857]/70 p-4"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#464B71]">
                  {stockForm.id ? 'Update Vaccine Stock Vials' : 'Add Vaccine Stock Item'}
                </h2>
                <p className="text-xs text-[#464B71]/75">
                  Branch: <strong>{activeBranch?.shortName || branchId}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStockModalOpen(false)}
                className="rounded-xl bg-[#F2F2ED] p-2 text-[#464B71] hover:bg-[#DDDCD4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-extrabold text-[#464B71]">
                  Vaccine / Biological Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={stockForm.item_name}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, item_name: e.target.value })
                  }
                  placeholder="e.g. Verorab PVRV, Speeda PVRV, Equirab ERIG"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3.5 py-2 font-semibold text-[#464B71]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-[#464B71]">Category *</label>
                  <select
                    value={stockForm.category}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, category: e.target.value })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  >
                    <option value="vaccine">Anti-Rabies Vaccine</option>
                    <option value="erig">ERIG / HRIG</option>
                    <option value="tetanus">Tetanus Toxoid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={stockForm.batch_number}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, batch_number: e.target.value })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-mono text-xs font-semibold text-[#464B71]"
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
                    value={stockForm.stock_vials}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, stock_vials: e.target.value })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-extrabold text-[#464B71]"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockForm.reorder_level}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, reorder_level: e.target.value })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={stockForm.expiry_date}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, expiry_date: e.target.value })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-2.5 py-2 text-xs font-semibold text-[#464B71]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#F2F2ED] pt-3">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="min-h-[44px] rounded-xl border border-[#DDDCD4] px-4 py-2 text-xs font-extrabold text-[#464B71]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStock}
                  className="min-h-[44px] rounded-xl bg-[#118AB2] px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#0D6E8E] disabled:opacity-60"
                >
                  {savingStock ? 'Saving…' : 'Save Stock Vials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

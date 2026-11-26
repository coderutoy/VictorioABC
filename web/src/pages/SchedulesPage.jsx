import { useCallback, useEffect, useState } from 'react';
import {
  CalendarClock,
  Syringe,
  Search,
  RefreshCw,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useBranch } from '../context/BranchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';

const SCHED_STATUS_TONE = {
  scheduled: 'amber',
  completed: 'emerald',
  rescheduled: 'blue',
  defaulted: 'red',
};

export function SchedulesPage() {
  const { activeBranchId, activeBranch, canSwitchBranch } = useBranch();

  const [schedules, setSchedules] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [doseFilter, setDoseFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  // Administer modal
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [adminForm, setAdminForm] = useState({
    inventory_batch_id: '',
    doses_deducted: 1,
    injection_site: 'Both deltoids (0.1 mL ID)',
    adverse_reactions: 'None',
    administration_notes: '',
  });
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  // Reschedule modal
  const [reschedulingItem, setReschedulingItem] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    scheduled_date: '',
    reschedule_reason: '',
  });
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const scopeLabel = activeBranch
    ? activeBranch.name
    : canSwitchBranch
      ? 'All Branches (HQ)'
      : 'Assigned Branch';

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeBranchId) params.branch_id = activeBranchId;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (doseFilter !== 'ALL') params.dose_number = doseFilter;
      if (search.trim()) params.search = search.trim();

      const [schedRes, invRes] = await Promise.all([
        api.get('/schedules', { params }),
        api.get('/inventory', {
          params: {
            ...(activeBranchId ? { branch_id: activeBranchId } : {}),
            item_type: 'anti_rabies',
            available_only: 'true',
          },
        }),
      ]);

      setSchedules(schedRes.data?.data || []);
      setInventory(invRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load PEP schedules.');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId, statusFilter, doseFilter, search]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const openAdminModal = (sched) => {
    setSelectedSchedule(sched);
    setAdminForm({
      inventory_batch_id: inventory[0]?.id || '',
      doses_deducted: 1,
      injection_site: 'Both deltoids (0.1 mL ID)',
      adverse_reactions: 'None',
      administration_notes: '',
    });
  };

  const handleAdministerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    setSubmittingAdmin(true);
    setError('');
    try {
      await api.post(`/schedules/${selectedSchedule.id}/administer`, {
        inventory_batch_id: adminForm.inventory_batch_id || null,
        doses_deducted: Number(adminForm.doses_deducted) || 1,
        injection_site: adminForm.injection_site,
        adverse_reactions: adminForm.adverse_reactions,
        administration_notes: adminForm.administration_notes,
      });
      setBanner(
        `Marked ${selectedSchedule.dose_number} as completed for ${selectedSchedule.bite_case?.patient?.full_name || 'Patient'}.`
      );
      setSelectedSchedule(null);
      await fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to administer dose.');
    } finally {
      setSubmittingAdmin(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!reschedulingItem) return;
    setSubmittingReschedule(true);
    setError('');
    try {
      await api.patch(`/schedules/${reschedulingItem.id}/reschedule`, rescheduleForm);
      setBanner(
        `Rescheduled ${reschedulingItem.dose_number} to ${rescheduleForm.scheduled_date}.`
      );
      setReschedulingItem(null);
      await fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule dose.');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">PEP Vaccination Schedules</h1>
            <Badge tone="teal">Scope: {scopeLabel}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Track Day 0, Day 3, Day 7, Day 14, and Day 28 anti-rabies doses, nurse administration, and rescheduling.
          </p>
        </div>

        <Button variant="secondary" onClick={fetchSchedules}>
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Schedules</span>
        </Button>
      </div>

      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span>{banner}</span>
          <button type="button" onClick={() => setBanner('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient name, QR code, barangay, or dose day..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={doseFilter}
              onChange={(e) => setDoseFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="ALL">All Dose Days</option>
              <option value="Day 0">Day 0</option>
              <option value="Day 3">Day 3</option>
              <option value="Day 7">Day 7</option>
              <option value="Day 14">Day 14</option>
              <option value="Day 28">Day 28</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Schedules Table */}
      <Card
        title={`PEP Dose Schedule Ledger (${schedules.length})`}
        subtitle="Administering a dose automatically deducts branch vaccine stock via PostgreSQL trigger."
      >
        {loading ? (
          <Spinner label="Loading PEP schedules..." />
        ) : schedules.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No PEP vaccination schedules found. Issue a Doctor Clinical Order to auto-generate a patient&apos;s PEP schedule.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Dose &amp; Scheduled Date</th>
                  <th className="px-4 py-3">Patient &amp; QR Pass</th>
                  <th className="px-4 py-3">Exposure &amp; Regimen</th>
                  <th className="px-4 py-3">Status &amp; Batch</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {schedules.map((sched) => {
                  const patient = sched.bite_case?.patient;
                  const order = sched.bite_case?.clinical_orders?.[0];
                  const isCompleted = sched.status === 'completed';

                  return (
                    <tr key={sched.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{sched.dose_number}</div>
                        <div className="text-xs text-slate-500">
                          Target: {sched.scheduled_date}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {patient?.full_name || 'Patient'}
                        </div>
                        <div className="text-xs text-slate-500">
                          <code className="font-mono text-brand-700">
                            {patient?.qr_code_hash}
                          </code>{' '}
                          &bull; {patient?.phone || 'No phone'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>
                          WHO Cat{' '}
                          <strong>
                            {sched.bite_case?.doctor_validated_category || 'II'}
                          </strong>{' '}
                          &bull; Regimen: <strong>{order?.regimen_type || 'ID'}</strong>
                        </div>
                        <div className="text-slate-500">
                          {sched.bite_case?.animal_type} ({sched.bite_case?.bite_site})
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge tone={SCHED_STATUS_TONE[sched.status] || 'slate'}>
                          {sched.status.toUpperCase()}
                        </Badge>
                        {isCompleted && (
                          <div className="mt-1 text-[11px] text-slate-500">
                            {sched.inventory?.vaccine_name} ({sched.inventory?.batch_number})
                            {sched.nurse?.full_name && ` • RN ${sched.nurse.full_name}`}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {!isCompleted ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setReschedulingItem(sched);
                                setRescheduleForm({
                                  scheduled_date: sched.scheduled_date,
                                  reschedule_reason: sched.reschedule_reason || '',
                                });
                              }}
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Reschedule</span>
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openAdminModal(sched)}
                            >
                              <Syringe className="h-3.5 w-3.5" />
                              <span>Administer</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Administered
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Administer Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Administer {selectedSchedule.dose_number}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedSchedule.bite_case?.patient?.full_name} &bull; Scheduled:{' '}
                  {selectedSchedule.scheduled_date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdministerSubmit} className="space-y-4 p-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Vaccine Batch (FEFO)
                </label>
                <select
                  value={adminForm.inventory_batch_id}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, inventory_batch_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {inventory.length === 0 ? (
                    <option value="">Auto-Select Active Branch Batch</option>
                  ) : (
                    inventory.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.vaccine_name} — {b.batch_number} ({b.quantity_remaining} left)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <Input
                id="sched_injection_site"
                label="Injection Site"
                value={adminForm.injection_site}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, injection_site: e.target.value })
                }
              />

              <Input
                id="sched_adverse"
                label="Adverse Reactions Observation"
                value={adminForm.adverse_reactions}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, adverse_reactions: e.target.value })
                }
              />

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <Button variant="secondary" onClick={() => setSelectedSchedule(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submittingAdmin}>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {submittingAdmin ? 'Recording...' : 'Confirm Administration'}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900">
                Reschedule {reschedulingItem.dose_number}
              </h2>
              <button
                type="button"
                onClick={() => setReschedulingItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 p-6">
              <Input
                id="new_scheduled_date"
                label="New Scheduled Date *"
                type="date"
                required
                value={rescheduleForm.scheduled_date}
                onChange={(e) =>
                  setRescheduleForm({
                    ...rescheduleForm,
                    scheduled_date: e.target.value,
                  })
                }
              />
              <Input
                id="reschedule_reason"
                label="Clinical / Patient Reason *"
                required
                placeholder="e.g. Patient fever / travel delay"
                value={rescheduleForm.reschedule_reason}
                onChange={(e) =>
                  setRescheduleForm({
                    ...rescheduleForm,
                    reschedule_reason: e.target.value,
                  })
                }
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setReschedulingItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submittingReschedule}>
                  {submittingReschedule ? 'Saving...' : 'Save New Date'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

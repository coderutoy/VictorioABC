import { useMemo, useState } from 'react';
import {
  UserPlus,
  Syringe,
  Search,
  CalendarClock,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  X,
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

const DOSE_TONE = {
  completed: 'green',
  scheduled: 'blue',
  missed: 'red',
};

const INITIAL_INTAKE = {
  full_name: '',
  phone: '',
  address: '',
  age: '',
  sex: 'male',
  animal_type: 'dog',
  wound_site: 'Right hand / forearm',
  exposure_date: new Date().toISOString().slice(0, 10),
  notes: '',
  forward_to_doctor: false,
};

export function NurseDashboardPage() {
  const { profile } = useAuth();
  const { activeBranch } = useBranch();
  const branchId = activeBranch?.id || profile?.branch_id || 'santa-maria';
  const today = new Date().toISOString().slice(0, 10);

  const {
    cases,
    doses,
    loading,
    refresh,
    createWalkInIntake,
    forwardCaseToDoctor,
    markDoseAdministered,
  } = useClinicalBranchData(branchId);

  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeForm, setIntakeForm] = useState(INITIAL_INTAKE);
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [administeringId, setAdministeringId] = useState(null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [banner, setBanner] = useState('');

  const queuedNurseCases = useMemo(
    () => cases.filter((c) => c.status === 'queued_nurse'),
    [cases]
  );

  const todayDoses = useMemo(
    () => doses.filter((d) => d.scheduled_date === today),
    [doses, today]
  );

  const missedDoses = useMemo(
    () =>
      doses.filter(
        (d) =>
          (d.scheduled_date < today && d.status === 'scheduled') ||
          d.status === 'missed'
      ),
    [doses, today]
  );

  const filteredLookupDoses = useMemo(() => {
    const q = lookupQuery.trim().toLowerCase();
    if (!q) return doses.slice(0, 12);
    return doses.filter(
      (d) =>
        (d.case_number || '').toLowerCase().includes(q) ||
        (d.patient?.full_name || '').toLowerCase().includes(q) ||
        (d.patient?.patient_code || '').toLowerCase().includes(q) ||
        String(d.dose_day).includes(q)
    );
  }, [doses, lookupQuery]);

  const dueTodayCount = todayDoses.filter((d) => d.status !== 'completed').length;
  const completedTodayCount = todayDoses.filter((d) => d.status === 'completed').length;

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!intakeForm.full_name.trim()) return;
    setSubmittingIntake(true);
    try {
      const created = await createWalkInIntake(intakeForm);
      setBanner(
        `Registered walk-in patient "${intakeForm.full_name}" (AES-256-GCM encrypted in patients table • ${created?.case_number}).`
      );
      setIntakeForm(INITIAL_INTAKE);
      setIntakeOpen(false);
    } finally {
      setSubmittingIntake(false);
    }
  };

  const handleForwardToDoctor = async (c) => {
    await forwardCaseToDoctor(c.id);
    setBanner(
      `Forwarded ${c.patient?.full_name || c.case_number} to Doctor Consultation Queue (pending_doctor).`
    );
  };

  const handleMarkAdministered = async (dose) => {
    setAdministeringId(dose.id);
    try {
      await markDoseAdministered(dose.id, {
        vaccine_brand: dose.vaccine_brand || 'Speeda PVRV',
        lot_number: dose.lot_number || 'LOT-2026-A1',
      });
      setBanner(
        `Marked Day ${dose.dose_day} PEP dose as administered for ${dose.patient?.full_name || dose.case_number} (1 vial deducted from branch inventory).`
      );
    } finally {
      setAdministeringId(null);
    }
  };

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Intake & Vaccination"
        icon={Syringe}
        title={`Nurse Workspace — ${profile?.full_name || 'Nurse Camille Reyes'}`}
        subtitle="Walk-in patient intake (AES-256-GCM encrypted PII), today's scheduled PEP doses, and dose administration logging."
        branchLabel={activeBranch?.name || 'Victorio ABC — Santa Maria, Bulacan'}
        branchAddress={activeBranch?.address}
      >
        <button
          type="button"
          onClick={refresh}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-white/25"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Queue</span>
        </button>
        <button
          type="button"
          data-testid="nurse-open-intake-btn"
          onClick={() => setIntakeOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#7CD5C7] px-4 py-2 text-xs font-extrabold text-[#464B71] transition hover:bg-[#68c7b8]"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Walk-In Patient Intake</span>
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Waiting for Nurse Triage"
          icon={ClipboardList}
          tone="amber"
          value={queuedNurseCases.length}
          hint="queued_nurse cases awaiting vitals"
          loading={loading}
        />
        <KpiCard
          label="Doses Due Today"
          icon={CalendarClock}
          tone="blue"
          value={dueTodayCount}
          hint="Scheduled PEP doses due today"
          loading={loading}
        />
        <KpiCard
          label="Completed Today"
          icon={Syringe}
          tone="mint"
          value={completedTodayCount}
          hint="PEP doses administered today"
          loading={loading}
        />
        <KpiCard
          label="Missed Follow-Ups"
          icon={AlertTriangle}
          tone="red"
          value={missedDoses.length}
          hint="Past-due scheduled PEP doses"
          loading={loading}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* 1. Patient Queue & Walk-In Intake */}
        <Panel
          title="Patient Queue & Intake (queued_nurse)"
          subtitle="Walk-in patients waiting for nurse vitals before physician WHO Category assessment"
          action={
            <button
              type="button"
              onClick={() => setIntakeOpen(true)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>New Walk-In</span>
            </button>
          }
        >
          {queuedNurseCases.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No patients waiting in the nurse intake queue. Click '+ Walk-In Patient Intake' to register a new exposure."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Case #</Th>
                  <Th>Patient</Th>
                  <Th>Exposure</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {queuedNurseCases.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-mono text-xs font-bold">{c.case_number}</Td>
                    <Td className="font-bold">{c.patient?.full_name || 'Walk-In Patient'}</Td>
                    <Td className="capitalize">
                      {c.animal_type} • {c.wound_site}
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => handleForwardToDoctor(c)}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#118AB2] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                      >
                        <span>Send to Doctor</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        {/* 2. Today's Scheduled Doses (PEP Day 0 / 3 / 7 / 14 / 28) */}
        <Panel
          title="Today's Scheduled Doses (PEP Day 0 / 3 / 7 / 14 / 28)"
          subtitle={`Scheduled for ${today} at ${activeBranch?.shortName || branchId}`}
        >
          {todayDoses.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No PEP doses are scheduled for today yet. When a Doctor assesses a Category II/III case, Day 0–28 doses appear here automatically."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Patient / Case</Th>
                  <Th>Dose Day</Th>
                  <Th>Vaccine</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {todayDoses.map((d) => (
                  <tr key={d.id}>
                    <Td>
                      <p className="font-bold">{d.patient?.full_name || d.case_number}</p>
                      <p className="font-mono text-[11px] text-[#464B71]/70">{d.case_number}</p>
                    </Td>
                    <Td className="font-extrabold">Day {d.dose_day}</Td>
                    <Td>{d.vaccine_brand || 'Speeda PVRV'}</Td>
                    <Td>
                      <StatusPill tone={DOSE_TONE[d.status] || 'navy'}>{d.status}</StatusPill>
                    </Td>
                    <Td>
                      {d.status !== 'completed' ? (
                        <button
                          type="button"
                          disabled={administeringId === d.id}
                          onClick={() => handleMarkAdministered(d)}
                          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#7CD5C7] px-3 py-1.5 text-xs font-extrabold text-[#464B71] hover:bg-[#68c7b8] disabled:opacity-60"
                        >
                          <Syringe className="h-3.5 w-3.5" />
                          <span>
                            {administeringId === d.id
                              ? 'Saving…'
                              : 'Mark Dose Administered'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700">
                          Administered
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      </div>

      {/* 3. Vaccination & Administration Log */}
      <Panel
        title="Vaccination & Administration Log (All Scheduled & Completed PEP Doses)"
        subtitle="Quick lookup by patient name, patient code, or case number to record administered vaccine doses"
      >
        <div className="mb-3 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#464B71]/50" />
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Filter PEP doses by patient name, case number (e.g. CASE-SAN-...), or dose day (0, 3, 7, 14, 28)..."
              aria-label="Filter PEP doses"
              className="min-h-[44px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 py-2 pl-10 pr-3 text-sm font-semibold text-[#464B71] focus:border-[#118AB2] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {filteredLookupDoses.length === 0 ? (
          <EmptyState
            loading={loading}
            message="No PEP doses found matching your filter."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Case #</Th>
                <Th>Patient</Th>
                <Th>Dose</Th>
                <Th>Scheduled Date</Th>
                <Th>Vaccine Brand</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2ED]">
              {filteredLookupDoses.map((d) => (
                <tr key={d.id}>
                  <Td className="font-mono text-xs font-bold">{d.case_number}</Td>
                  <Td className="font-bold">{d.patient?.full_name || 'Patient'}</Td>
                  <Td className="font-extrabold">Day {d.dose_day}</Td>
                  <Td className="whitespace-nowrap">{d.scheduled_date}</Td>
                  <Td>{d.vaccine_brand || 'Speeda PVRV'}</Td>
                  <Td>
                    <StatusPill tone={DOSE_TONE[d.status] || 'navy'}>{d.status}</StatusPill>
                  </Td>
                  <Td>
                    {d.status !== 'completed' ? (
                      <button
                        type="button"
                        disabled={administeringId === d.id}
                        onClick={() => handleMarkAdministered(d)}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#7CD5C7] px-3 py-1.5 text-xs font-extrabold text-[#464B71] hover:bg-[#68c7b8] disabled:opacity-60"
                      >
                        <Syringe className="h-3.5 w-3.5" />
                        <span>
                          {administeringId === d.id
                            ? 'Saving…'
                            : 'Mark Dose Administered'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700">
                        Completed
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      {/* Walk-In Patient Intake Modal */}
      {intakeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Walk-In Patient Intake Form"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#343857]/70 p-4"
        >
          <div className="w-full max-w-lg rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#464B71]">
                  Walk-In Patient Intake &amp; Triage
                </h2>
                <p className="text-xs text-[#464B71]/75">
                  Patient PII is encrypted with AES-256-GCM before storage in{' '}
                  <code>patients</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIntakeOpen(false)}
                className="rounded-xl bg-[#F2F2ED] p-2 text-[#464B71] hover:bg-[#DDDCD4]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-3 text-xs sm:text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={intakeForm.full_name}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, full_name: e.target.value })
                    }
                    placeholder="e.g. Maria Clara Santos"
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={intakeForm.phone}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, phone: e.target.value })
                    }
                    placeholder="09XX XXX XXXX"
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-extrabold text-[#464B71]">Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={intakeForm.age}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, age: e.target.value })
                    }
                    placeholder="28"
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block font-extrabold text-[#464B71]">Sex</label>
                  <select
                    value={intakeForm.sex}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, sex: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block font-extrabold text-[#464B71]">
                    Biting Animal *
                  </label>
                  <select
                    value={intakeForm.animal_type}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, animal_type: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="other">Other Mammal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-[#464B71]">
                  Home Address
                </label>
                <input
                  type="text"
                  value={intakeForm.address}
                  onChange={(e) =>
                    setIntakeForm({ ...intakeForm, address: e.target.value })
                  }
                  placeholder="Barangay / Municipality, Bulacan"
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Wound / Bite Site *
                  </label>
                  <input
                    type="text"
                    required
                    value={intakeForm.wound_site}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, wound_site: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Exposure Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={intakeForm.exposure_date}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, exposure_date: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/50 p-3 text-xs font-bold text-[#464B71]">
                <input
                  type="checkbox"
                  checked={intakeForm.forward_to_doctor}
                  onChange={(e) =>
                    setIntakeForm({
                      ...intakeForm,
                      forward_to_doctor: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[#118AB2]"
                />
                <span>
                  Vitals complete — send directly to Doctor Assessment Queue (
                  <code>pending_doctor</code>)
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 border-t border-[#F2F2ED] pt-3">
                <button
                  type="button"
                  onClick={() => setIntakeOpen(false)}
                  className="min-h-[44px] rounded-xl border border-[#DDDCD4] px-4 py-2 text-xs font-extrabold text-[#464B71]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIntake}
                  className="min-h-[44px] rounded-xl bg-[#118AB2] px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#0D6E8E] disabled:opacity-60"
                >
                  {submittingIntake ? 'Encrypting & Saving…' : 'Register Walk-In Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

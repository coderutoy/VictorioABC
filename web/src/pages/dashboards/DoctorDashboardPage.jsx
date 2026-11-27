import { useMemo, useState } from 'react';
import {
  Stethoscope,
  ShieldAlert,
  Syringe,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
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

export function DoctorDashboardPage() {
  const { profile } = useAuth();
  const { activeBranch } = useBranch();
  const branchId = activeBranch?.id || profile?.branch_id || 'santa-maria';
  const today = new Date().toISOString().slice(0, 10);

  const {
    cases,
    doses,
    loading,
    refresh,
    submitDoctorAssessment,
  } = useClinicalBranchData(branchId);

  const [selectedCase, setSelectedCase] = useState(null);
  const [assessForm, setAssessForm] = useState({
    exposure_category: 'II',
    erig_required: false,
    tetanus_given: true,
    day0_date: today,
    vaccine_brand: 'Speeda PVRV',
    notes: '15-minute wound wash verified. Initiate 5-milestone WHO PEP schedule (Day 0, 3, 7, 14, 28).',
  });
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState('');

  const pendingDoctorCases = useMemo(
    () =>
      cases.filter((c) =>
        ['pending_doctor', 'queued_nurse'].includes(c.status)
      ),
    [cases]
  );

  const highRiskCases = useMemo(
    () =>
      cases.filter(
        (c) => c.exposure_category === 'III' && c.status !== 'completed'
      ),
    [cases]
  );

  const overdueDoses = useMemo(
    () =>
      doses.filter(
        (d) => d.scheduled_date < today && d.status === 'scheduled'
      ),
    [doses, today]
  );

  const activeAssessmentCase = selectedCase || pendingDoctorCases[0] || null;

  const handleSelectCase = (c) => {
    setSelectedCase(c);
    setAssessForm((prev) => ({
      ...prev,
      exposure_category: c.exposure_category || 'II',
      erig_required: c.exposure_category === 'III' || Boolean(c.erig_required),
      tetanus_given: c.tetanus_given ?? true,
      notes:
        c.notes ||
        '15-minute wound wash verified. Initiate WHO PEP schedule (Day 0, 3, 7, 14, 28).',
    }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!activeAssessmentCase) return;
    setSubmitting(true);
    try {
      await submitDoctorAssessment(activeAssessmentCase.id, assessForm);
      setBanner(
        `Validated ${activeAssessmentCase.patient?.full_name || activeAssessmentCase.case_number} as WHO Category ${assessForm.exposure_category} and auto-generated Day 0, 3, 7, 14, 28 PEP doses.`
      );
      setSelectedCase(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Clinical Assessment & Prescription"
        icon={Stethoscope}
        title={`Doctor Workspace — ${profile?.full_name || 'Dr. Maria Santos'}`}
        subtitle="WHO Category I–III consultation queue, ERIG/tetanus indication, and automated Day 0, 3, 7, 14, 28 PEP schedule orders."
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Pending Assessment"
          icon={UserCheck}
          tone="amber"
          value={pendingDoctorCases.length}
          hint="Cases awaiting WHO Category I–III order"
          loading={loading}
        />
        <KpiCard
          label="Open Category III Cases"
          icon={ShieldAlert}
          tone="red"
          value={highRiskCases.length}
          hint="High-risk transdermal / ERIG cases"
          loading={loading}
        />
        <KpiCard
          label="Overdue Follow-Ups"
          icon={AlertTriangle}
          tone="navy"
          value={overdueDoses.length}
          hint="Past-due scheduled PEP doses"
          loading={loading}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* 1. Patients Pending Assessment / Consultation Queue */}
        <Panel
          title="Patients Pending Assessment (pending_doctor)"
          subtitle="Select a patient encounter to classify WHO Category I–III and generate PEP doses"
        >
          {pendingDoctorCases.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No patients are currently waiting for physician assessment. Cases registered by the Nurse appear here automatically."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Case #</Th>
                  <Th>Patient</Th>
                  <Th>Exposure</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {pendingDoctorCases.map((c) => {
                  const isCurrent = activeAssessmentCase?.id === c.id;
                  return (
                    <tr
                      key={c.id}
                      className={isCurrent ? 'bg-[#EAFBF8]' : ''}
                    >
                      <Td className="font-mono text-xs font-bold">{c.case_number}</Td>
                      <Td className="font-bold">
                        {c.patient?.full_name || 'Walk-In Patient'}
                      </Td>
                      <Td className="capitalize">
                        {c.animal_type} • {c.wound_site}
                      </Td>
                      <Td>
                        <StatusPill tone="amber">{c.status}</StatusPill>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => handleSelectCase(c)}
                          className="min-h-[38px] rounded-lg bg-[#118AB2] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                        >
                          {isCurrent ? 'Selected' : 'Assess Case'}
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        {/* 2. Clinical Review & Prescription Workspace */}
        <Panel
          title="Clinical Review & Prescription Workspace"
          subtitle="Submit WHO Category I–III assessment and auto-generate Day 0, 3, 7, 14, 28 PEP doses"
        >
          {!activeAssessmentCase ? (
            <EmptyState
              loading={loading}
              message="Select a patient from the consultation queue on the left to prescribe a WHO Category I–III PEP order."
            />
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-3.5 text-xs sm:text-sm">
              <div className="rounded-xl border border-[#7CD5C7] bg-[#EAFBF8] p-3.5">
                <p className="text-xs font-extrabold text-[#118AB2]">
                  Active Patient Encounter: {activeAssessmentCase.case_number}
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-[#464B71]">
                  {activeAssessmentCase.patient?.full_name || 'Walk-In Patient'}
                </p>
                <p className="text-xs text-[#464B71]/80 capitalize">
                  Animal: {activeAssessmentCase.animal_type} &bull; Wound Site:{' '}
                  {activeAssessmentCase.wound_site} &bull; Exposed:{' '}
                  {activeAssessmentCase.exposure_date}
                </p>
              </div>

              <div>
                <label className="block font-extrabold text-[#464B71]">
                  1. WHO Exposure Category Classification *
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[
                    { cat: 'I', label: 'Category I (Wash Only)' },
                    { cat: 'II', label: 'Category II (PEP Vaccine)' },
                    { cat: 'III', label: 'Category III (PEP + ERIG)' },
                  ].map(({ cat, label }) => {
                    const active = assessForm.exposure_category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setAssessForm({
                            ...assessForm,
                            exposure_category: cat,
                            erig_required: cat === 'III',
                          })
                        }
                        className={`min-h-[44px] rounded-xl border-2 px-2.5 py-2 text-xs font-extrabold transition ${
                          active
                            ? 'border-[#118AB2] bg-[#118AB2] text-white'
                            : 'border-[#DDDCD4] bg-[#F2F2ED]/60 text-[#464B71]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Day 0 Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={assessForm.day0_date}
                    onChange={(e) =>
                      setAssessForm({ ...assessForm, day0_date: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Anti-Rabies Vaccine Brand
                  </label>
                  <select
                    value={assessForm.vaccine_brand}
                    onChange={(e) =>
                      setAssessForm({
                        ...assessForm,
                        vaccine_brand: e.target.value,
                      })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  >
                    <option value="Speeda PVRV">Speeda PVRV</option>
                    <option value="Verorab PVRV">Verorab PVRV</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/50 p-3 text-xs font-bold text-[#464B71]">
                  <input
                    type="checkbox"
                    checked={assessForm.erig_required}
                    onChange={(e) =>
                      setAssessForm({
                        ...assessForm,
                        erig_required: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#118AB2]"
                  />
                  <span>Equirab ERIG (40 IU/kg) Infiltration Required</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/50 p-3 text-xs font-bold text-[#464B71]">
                  <input
                    type="checkbox"
                    checked={assessForm.tetanus_given}
                    onChange={(e) =>
                      setAssessForm({
                        ...assessForm,
                        tetanus_given: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#118AB2]"
                  />
                  <span>Tetanus Toxoid (TT 0.5 mL IM) Ordered</span>
                </label>
              </div>

              <div>
                <label className="block font-extrabold text-[#464B71]">
                  Physician Clinical Notes &amp; Instructions
                </label>
                <textarea
                  rows={2}
                  value={assessForm.notes}
                  onChange={(e) =>
                    setAssessForm({ ...assessForm, notes: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 text-xs font-semibold text-[#464B71]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#0D6E8E] disabled:opacity-60"
              >
                <Syringe className="h-4 w-4" />
                <span>
                  {submitting
                    ? 'Saving Order & Generating Doses…'
                    : 'Approve WHO Assessment & Generate Day 0, 3, 7, 14, 28 PEP Doses'}
                </span>
              </button>
            </form>
          )}
        </Panel>
      </div>

      {/* 3. Recent Cases & Follow-Up Alerts */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Recent High-Risk (Category III) Cases"
          subtitle="Active Category III cases requiring ERIG infiltration and close follow-up"
        >
          {highRiskCases.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No open WHO Category III cases at this branch."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Case #</Th>
                  <Th>Patient</Th>
                  <Th>Exposure</Th>
                  <Th>ERIG</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {highRiskCases.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-mono text-xs font-bold">{c.case_number}</Td>
                    <Td className="font-bold">{c.patient?.full_name || 'Patient'}</Td>
                    <Td className="capitalize">
                      {c.animal_type} • {c.wound_site}
                    </Td>
                    <Td>
                      <StatusPill tone={c.erig_required ? 'red' : 'navy'}>
                        {c.erig_required ? 'ERIG Ordered' : 'No ERIG'}
                      </StatusPill>
                    </Td>
                    <Td>
                      <StatusPill tone="blue">{c.status}</StatusPill>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        <Panel
          title="Follow-Up Alerts"
          subtitle="Patients with past-due scheduled PEP doses"
        >
          {overdueDoses.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No overdue follow-up PEP doses at this branch."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Case #</Th>
                  <Th>Patient</Th>
                  <Th>Dose</Th>
                  <Th>Scheduled Date</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {overdueDoses.map((d) => (
                  <tr key={d.id}>
                    <Td className="font-mono text-xs font-bold">{d.case_number}</Td>
                    <Td className="font-bold">{d.patient?.full_name || 'Patient'}</Td>
                    <Td className="font-extrabold">Day {d.dose_day}</Td>
                    <Td>
                      <StatusPill tone="red">{d.scheduled_date}</StatusPill>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      </div>
    </div>
  );
}

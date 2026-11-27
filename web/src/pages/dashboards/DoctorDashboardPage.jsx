import { useMemo, useState } from 'react';
import {
  Stethoscope,
  ShieldAlert,
  Syringe,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ChevronDown,
  Activity,
  ClipboardCheck,
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
  const branchId = profile?.branch_id || activeBranch?.id || 'santa-maria';
  const today = new Date().toISOString().slice(0, 10);

  const {
    cases,
    loading,
    error: dataError,
    refresh,
    updateClinicalCase,
  } = useClinicalBranchData(branchId);

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'active' | 'completed'
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [busyCaseId, setBusyCaseId] = useState(null);

  // WHO Rabies Exposure Assessment Modal
  const [assessingCase, setAssessingCase] = useState(null);
  const [assessForm, setAssessForm] = useState({
    exposure_category: 'II',
    erig_required: false,
    tetanus_given: true,
    day0_date: today,
    vaccine_brand: 'Speeda PVRV',
    notes: '15-minute wound wash verified. Initiate 5-milestone WHO PEP schedule (Day 0, 3, 7, 14, 28).',
  });
  const [submittingAssess, setSubmittingAssess] = useState(false);

  const [banner, setBanner] = useState('');
  const [actionError, setActionError] = useState('');

  const pendingCases = useMemo(
    () => cases.filter((c) => c.status === 'pending_doctor' || c.status === 'queued_nurse'),
    [cases]
  );

  const activePepCases = useMemo(
    () => cases.filter((c) => c.status === 'active_pep'),
    [cases]
  );

  const completedCases = useMemo(
    () => cases.filter((c) => c.status === 'completed'),
    [cases]
  );

  const openAssessmentModal = (c) => {
    setActionError('');
    setAssessingCase(c);
    const cat = c.exposure_category || 'II';
    setAssessForm({
      exposure_category: cat,
      erig_required: cat === 'III' || Boolean(c.erig_required),
      tetanus_given: c.tetanus_given ?? true,
      day0_date: today,
      vaccine_brand: 'Speeda PVRV',
      notes:
        c.notes ||
        '15-minute wound wash verified. Initiate WHO PEP schedule (Day 0, 3, 7, 14, 28).',
    });
  };

  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    if (!assessingCase) return;
    setSubmittingAssess(true);
    setActionError('');
    try {
      const cat = assessForm.exposure_category;
      const nextStatus = cat === 'I' ? 'completed' : 'active_pep';
      await updateClinicalCase(assessingCase.id, {
        exposure_category: cat,
        status: nextStatus,
        erig_required: Boolean(assessForm.erig_required || cat === 'III'),
        tetanus_given: Boolean(assessForm.tetanus_given),
        day0_date: assessForm.day0_date,
        vaccine_brand: assessForm.vaccine_brand,
        notes: assessForm.notes,
      });
      setBanner(
        cat === 'I'
          ? `Approved WHO Category I assessment for ${assessingCase.patient?.full_name || assessingCase.case_number} (marked completed, no PEP vaccine required).`
          : `Approved WHO Category ${cat} assessment for ${assessingCase.patient?.full_name || assessingCase.case_number} and generated Day 0, 3, 7, 14, 28 PEP schedule.`
      );
      setAssessingCase(null);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to save clinical assessment.');
    } finally {
      setSubmittingAssess(false);
    }
  };

  const handleSaveFollowUpNotes = async (c) => {
    setBusyCaseId(c.id);
    setActionError('');
    try {
      const nextNotes = noteDrafts[c.id] !== undefined ? noteDrafts[c.id] : c.notes;
      await updateClinicalCase(c.id, { notes: nextNotes });
      setBanner(`Saved follow-up clinical notes for ${c.case_number}.`);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to save notes.');
    } finally {
      setBusyCaseId(null);
    }
  };

  const handleMarkCaseCompleted = async (c) => {
    setBusyCaseId(c.id);
    setActionError('');
    try {
      await updateClinicalCase(c.id, { status: 'completed' });
      setBanner(`Marked case ${c.case_number} (${c.patient?.full_name}) as completed.`);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to complete case.');
    } finally {
      setBusyCaseId(null);
    }
  };

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Clinical Assessment & Prescription"
        icon={Stethoscope}
        title={`Doctor Workspace — ${profile?.full_name || 'Dr. Maria Santos'}`}
        subtitle="WHO Category I–III exposure assessment, ERIG/tetanus orders, and Day 0–28 active PEP timeline monitoring."
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

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Pending Clinical Assessments"
          icon={UserCheck}
          tone="amber"
          value={pendingCases.length}
          hint="Cases awaiting WHO Category I–III order"
          loading={loading}
        />
        <KpiCard
          label="Active PEP Cases"
          icon={Activity}
          tone="blue"
          value={activePepCases.length}
          hint="Patients undergoing Day 0–28 schedule"
          loading={loading}
        />
        <KpiCard
          label="Completed Cases"
          icon={ClipboardCheck}
          tone="mint"
          value={completedCases.length}
          hint="Cleared & completed consultations"
          loading={loading}
        />
      </div>

      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label="Doctor workspace sections"
        className="flex flex-wrap items-center gap-2 border-b border-[#DDDCD4] pb-3"
      >
        {[
          {
            id: 'pending',
            label: `Pending Clinical Assessments (${pendingCases.length})`,
            icon: Stethoscope,
          },
          {
            id: 'active',
            label: `Active PEP Monitoring (${activePepCases.length})`,
            icon: Activity,
          },
          {
            id: 'completed',
            label: `Completed Cases (${completedCases.length})`,
            icon: ClipboardCheck,
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

      {/* TAB 1: Pending Clinical Assessments (`pending_doctor`) */}
      {activeTab === 'pending' && (
        <Panel
          title="Pending Clinical Assessments (pending_doctor)"
          subtitle="Click 'Assess Patient' to classify WHO Exposure Category (I / II / III) and auto-generate the Day 0, 3, 7, 14, 28 PEP schedule"
        >
          {pendingCases.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No patients are currently waiting for physician assessment."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Case #</Th>
                  <Th>Patient</Th>
                  <Th>Animal &amp; Wound Site</Th>
                  <Th>Exposure Date</Th>
                  <Th>Nurse Triage Notes</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {pendingCases.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-mono text-xs font-bold">{c.case_number}</Td>
                    <Td>
                      <p className="font-bold">{c.patient?.full_name || 'Patient'}</p>
                      <p className="text-[11px] text-[#464B71]/70">
                        {c.patient?.patient_code} • Age {c.patient?.age ?? '—'}
                      </p>
                    </Td>
                    <Td className="capitalize">
                      {c.animal_type} • {c.wound_site}
                    </Td>
                    <Td className="whitespace-nowrap">{c.exposure_date}</Td>
                    <Td className="max-w-xs text-xs text-[#464B71]/85">
                      {c.notes || '—'}
                    </Td>
                    <Td>
                      <StatusPill tone="amber">{c.status}</StatusPill>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => openAssessmentModal(c)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                      >
                        <Stethoscope className="h-3.5 w-3.5" />
                        <span>Assess Patient</span>
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      )}

      {/* TAB 2: Active PEP Monitoring (`active_pep`) */}
      {activeTab === 'active' && (
        <Panel
          title="Active PEP Monitoring (Day 0, 3, 7, 14, 28 Timeline)"
          subtitle="Expand any active case to inspect its 5-dose milestone timeline, save follow-up clinical notes, or mark completed"
        >
          {activePepCases.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No active PEP cases at this branch."
            />
          ) : (
            <div className="space-y-3">
              {activePepCases.map((c) => {
                const isExpanded = expandedCaseId === c.id;
                const caseDoses = Array.isArray(c.pep_doses) ? c.pep_doses : [];
                const completedCount = caseDoses.filter(
                  (d) => d.status === 'completed'
                ).length;
                const isBusy = busyCaseId === c.id;

                return (
                  <div
                    key={c.id}
                    className="overflow-hidden rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-[#118AB2]">
                            {c.case_number}
                          </span>
                          <span className="text-sm font-extrabold text-[#464B71]">
                            {c.patient?.full_name || 'Patient'}
                          </span>
                          <StatusPill
                            tone={c.exposure_category === 'III' ? 'red' : 'amber'}
                          >
                            WHO Category {c.exposure_category || 'II'}
                          </StatusPill>
                          {c.erig_required && (
                            <StatusPill tone="red">ERIG Infiltration</StatusPill>
                          )}
                          {c.tetanus_given && (
                            <StatusPill tone="blue">Tetanus Given</StatusPill>
                          )}
                        </div>
                        <p className="text-xs text-[#464B71]/75 capitalize">
                          {c.animal_type} • {c.wound_site} • Exposed {c.exposure_date} •{' '}
                          <strong>
                            {completedCount}/{caseDoses.length || 5} doses completed
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCaseId(isExpanded ? null : c.id)
                          }
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3.5 py-1.5 text-xs font-extrabold text-[#464B71] hover:bg-[#DDDCD4]"
                        >
                          <span>{isExpanded ? 'Hide Timeline' : 'View 5-Dose Timeline'}</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleMarkCaseCompleted(c)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mark Case Completed</span>
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#DDDCD4] p-4 space-y-4">
                        {/* 5-Dose Day 0-28 Timeline Grid */}
                        <div className="grid gap-2.5 sm:grid-cols-5">
                          {caseDoses.map((d) => (
                            <div
                              key={d.id}
                              className={`rounded-xl border p-3 text-xs ${
                                d.status === 'completed'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                  : d.status === 'missed'
                                    ? 'border-red-300 bg-red-50 text-red-900'
                                    : 'border-[#DDDCD4] bg-white text-[#464B71]'
                              }`}
                            >
                              <div className="flex items-center justify-between font-extrabold">
                                <span>Day {d.dose_day}</span>
                                <span className="uppercase text-[10px]">{d.status}</span>
                              </div>
                              <p className="mt-1 font-semibold">{d.scheduled_date}</p>
                              <p className="mt-0.5 text-[11px] opacity-80">
                                {d.vaccine_brand || 'Speeda PVRV'}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Follow-up Clinical Notes Editor */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                          <div className="flex-1">
                            <label className="block text-xs font-extrabold text-[#464B71]">
                              Follow-Up Clinical Notes
                            </label>
                            <textarea
                              rows={2}
                              value={
                                noteDrafts[c.id] !== undefined
                                  ? noteDrafts[c.id]
                                  : c.notes || ''
                              }
                              onChange={(e) =>
                                setNoteDrafts({
                                  ...noteDrafts,
                                  [c.id]: e.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-xl border border-[#DDDCD4] bg-white px-3 py-2 text-xs font-semibold text-[#464B71]"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleSaveFollowUpNotes(c)}
                            className="min-h-[40px] shrink-0 rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                          >
                            Save Follow-Up Notes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {/* TAB 3: Completed Cases (`completed`) */}
      {activeTab === 'completed' && (
        <Panel
          title="Completed Cases History (completed)"
          subtitle="Read-only clinical record of completed PEP regimens and Category I clearances"
        >
          {completedCases.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No completed cases recorded for this branch yet."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Case #</Th>
                  <Th>Patient</Th>
                  <Th>Exposure</Th>
                  <Th>WHO Category</Th>
                  <Th>ERIG / Tetanus</Th>
                  <Th>Doses Completed</Th>
                  <Th>Clinical Notes</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {completedCases.map((c) => {
                  const caseDoses = Array.isArray(c.pep_doses) ? c.pep_doses : [];
                  const doneDoses = caseDoses.filter((d) => d.status === 'completed');
                  return (
                    <tr key={c.id}>
                      <Td className="font-mono text-xs font-bold">{c.case_number}</Td>
                      <Td>
                        <p className="font-bold">{c.patient?.full_name || 'Patient'}</p>
                        <p className="text-[11px] text-[#464B71]/70">
                          {c.patient?.patient_code}
                        </p>
                      </Td>
                      <Td className="capitalize">
                        {c.animal_type} • {c.wound_site} ({c.exposure_date})
                      </Td>
                      <Td>
                        <StatusPill
                          tone={
                            c.exposure_category === 'III'
                              ? 'red'
                              : c.exposure_category === 'II'
                                ? 'amber'
                                : 'green'
                          }
                        >
                          Category {c.exposure_category || 'I'}
                        </StatusPill>
                      </Td>
                      <Td className="text-xs">
                        {c.erig_required ? 'ERIG + ' : ''}
                        {c.tetanus_given ? 'Tetanus' : 'Wash Only'}
                      </Td>
                      <Td>
                        <StatusPill tone="green">
                          {doneDoses.length}/{caseDoses.length} doses
                        </StatusPill>
                      </Td>
                      <Td className="max-w-xs text-xs text-[#464B71]/85">
                        {c.notes || '—'}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      )}

      {/* Modal: WHO Rabies Exposure Assessment */}
      {assessingCase && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="WHO Rabies Exposure Assessment"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#343857]/70 p-4"
        >
          <div className="w-full max-w-lg rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#464B71]">
                  WHO Rabies Exposure Assessment — {assessingCase.case_number}
                </h2>
                <p className="text-xs text-[#464B71]/75">
                  Patient: <strong>{assessingCase.patient?.full_name}</strong> •{' '}
                  <span className="capitalize">
                    {assessingCase.animal_type} ({assessingCase.wound_site})
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssessingCase(null)}
                className="rounded-xl bg-[#F2F2ED] p-2 text-[#464B71]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssessment} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-extrabold text-[#464B71]">
                  1. Select WHO Exposure Category *
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
                    Day 0 Initiation Date *
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
                    Recommended Vaccine Brand
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
                  <span>ERIG Infiltration Required (40 IU/kg)</span>
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
                  <span>Tetanus Toxoid Given (0.5 mL IM)</span>
                </label>
              </div>

              <div>
                <label className="block font-extrabold text-[#464B71]">
                  Clinical Notes &amp; Prescription Instructions
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

              <div className="flex items-center justify-end gap-2 border-t border-[#F2F2ED] pt-3">
                <button
                  type="button"
                  onClick={() => setAssessingCase(null)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 text-xs font-extrabold text-[#464B71]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssess}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#0D6E8E]"
                >
                  <Syringe className="h-4 w-4" />
                  <span>
                    {submittingAssess
                      ? 'Approving & Generating…'
                      : 'Approve & Generate PEP Schedule'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

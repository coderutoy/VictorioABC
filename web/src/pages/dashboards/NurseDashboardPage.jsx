import { useMemo, useState } from 'react';
import {
  UserPlus,
  Syringe,
  Search,
  CalendarClock,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Edit3,
  X,
  RefreshCw,
  Users,
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
  notes: '15-minute soap and water wash performed at clinic intake.',
  forward_to_doctor: false,
};

export function NurseDashboardPage() {
  const { profile } = useAuth();
  const { activeBranch } = useBranch();
  const branchId = profile?.branch_id || activeBranch?.id || 'santa-maria';
  const today = new Date().toISOString().slice(0, 10);

  const {
    summary,
    inventory,
    cases,
    doses,
    patients,
    loading,
    error: dataError,
    refresh,
    createWalkInPatient,
    updatePatientInfo,
    updateClinicalCase,
    administerPepDose,
    missOrReschedulePepDose,
  } = useClinicalBranchData(branchId);

  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'doses' | 'patients'
  const [doseDateFilter, setDoseDateFilter] = useState('today'); // 'today' | 'upcoming' | 'all'
  const [patientSearch, setPatientSearch] = useState('');

  const [banner, setBanner] = useState('');
  const [actionError, setActionError] = useState('');

  // Walk-In Patient Intake Modal
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeForm, setIntakeForm] = useState(INITIAL_INTAKE);
  const [submittingIntake, setSubmittingIntake] = useState(false);

  // Edit Triage Notes Modal
  const [editingTriageCase, setEditingTriageCase] = useState(null);
  const [triageNotesDraft, setTriageNotesDraft] = useState('');
  const [triageWoundDraft, setTriageWoundDraft] = useState('');
  const [savingTriage, setSavingTriage] = useState(false);

  // Administer Dose Modal (selects live vaccine batch from inventory)
  const [administeringDose, setAdministeringDose] = useState(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [lotNumberDraft, setLotNumberDraft] = useState('');
  const [savingAdminister, setSavingAdminister] = useState(false);

  // Reschedule / Mark Missed Dose Modal
  const [reschedulingDose, setReschedulingDose] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [savingReschedule, setSavingReschedule] = useState(false);

  // Edit Patient Modal
  const [editingPatient, setEditingPatient] = useState(null);
  const [patientForm, setPatientForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    age: '',
    sex: 'male',
  });
  const [savingPatient, setSavingPatient] = useState(false);

  const vaccineBatches = useMemo(
    () => inventory.filter((i) => i.category === 'vaccine'),
    [inventory]
  );

  const queuedNurseCases = useMemo(
    () => cases.filter((c) => c.status === 'queued_nurse'),
    [cases]
  );

  const filteredDoses = useMemo(() => {
    if (doseDateFilter === 'today') {
      return doses.filter((d) => d.scheduled_date === today);
    }
    if (doseDateFilter === 'upcoming') {
      return doses.filter((d) => d.scheduled_date >= today);
    }
    return doses;
  }, [doses, doseDateFilter, today]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.patient_code || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q)
    );
  }, [patients, patientSearch]);

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!intakeForm.full_name.trim()) return;
    setSubmittingIntake(true);
    setActionError('');
    try {
      const result = await createWalkInPatient(intakeForm);
      setBanner(
        `Registered walk-in patient "${intakeForm.full_name}" (encrypted in patients • Case ${result?.case?.case_number || 'created'}).`
      );
      setIntakeForm(INITIAL_INTAKE);
      setIntakeOpen(false);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to register walk-in patient.');
    } finally {
      setSubmittingIntake(false);
    }
  };

  const openEditTriageModal = (c) => {
    setEditingTriageCase(c);
    setTriageWoundDraft(c.wound_site || '');
    setTriageNotesDraft(c.notes || '');
  };

  const handleSaveTriageNotes = async (e) => {
    e.preventDefault();
    if (!editingTriageCase) return;
    setSavingTriage(true);
    setActionError('');
    try {
      await updateClinicalCase(editingTriageCase.id, {
        wound_site: triageWoundDraft,
        notes: triageNotesDraft,
      });
      setBanner(`Updated nurse triage notes for ${editingTriageCase.case_number}.`);
      setEditingTriageCase(null);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to update triage notes.');
    } finally {
      setSavingTriage(false);
    }
  };

  const handleForwardToDoctor = async (c) => {
    setActionError('');
    try {
      await updateClinicalCase(c.id, { status: 'pending_doctor' });
      setBanner(
        `Forwarded ${c.patient?.full_name || c.case_number} to Doctor Consultation Queue (pending_doctor).`
      );
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to forward case to doctor.');
    }
  };

  const openAdministerModal = (dose) => {
    setActionError('');
    const defaultBatch =
      vaccineBatches.find((b) => Number(b.stock_vials) > 0) || vaccineBatches[0] || null;
    setAdministeringDose(dose);
    setSelectedInventoryId(defaultBatch?.id || '');
    setLotNumberDraft(defaultBatch?.batch_number || dose.lot_number || 'SPD-2026-LOT');
  };

  const handleConfirmAdminister = async (e) => {
    e.preventDefault();
    if (!administeringDose) return;
    setSavingAdminister(true);
    setActionError('');
    try {
      const batchObj = vaccineBatches.find((b) => b.id === selectedInventoryId);
      await administerPepDose(administeringDose.id, {
        inventory_id: selectedInventoryId || undefined,
        vaccine_brand: batchObj?.item_name || administeringDose.vaccine_brand || 'Speeda PVRV',
        lot_number: lotNumberDraft || batchObj?.batch_number || 'SPD-2026-LOT',
      });
      setBanner(
        `Administered Day ${administeringDose.dose_day} dose for ${administeringDose.patient?.full_name || administeringDose.case_number} (1 vial deducted from branch inventory).`
      );
      setAdministeringDose(null);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to record dose administration.');
    } finally {
      setSavingAdminister(false);
    }
  };

  const openRescheduleModal = (dose) => {
    setActionError('');
    setReschedulingDose(dose);
    setRescheduleDate(dose.scheduled_date || today);
  };

  const handleSaveReschedule = async (newStatus) => {
    if (!reschedulingDose) return;
    setSavingReschedule(true);
    setActionError('');
    try {
      await missOrReschedulePepDose(reschedulingDose.id, {
        status: newStatus,
        scheduled_date: newStatus === 'scheduled' ? rescheduleDate : undefined,
      });
      setBanner(
        newStatus === 'missed'
          ? `Marked Day ${reschedulingDose.dose_day} dose as missed.`
          : `Rescheduled Day ${reschedulingDose.dose_day} dose to ${rescheduleDate}.`
      );
      setReschedulingDose(null);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to update dose schedule.');
    } finally {
      setSavingReschedule(false);
    }
  };

  const openEditPatientModal = (p) => {
    setActionError('');
    setEditingPatient(p);
    setPatientForm({
      full_name: p.full_name || '',
      phone: p.phone || '',
      address: p.address || '',
      age: p.age ?? '',
      sex: p.sex || 'male',
    });
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;
    setSavingPatient(true);
    setActionError('');
    try {
      await updatePatientInfo(editingPatient.id, patientForm);
      setBanner(`Updated encrypted patient record for ${patientForm.full_name}.`);
      setEditingPatient(null);
    } catch (err) {
      setActionError(err.userMessage || err.message || 'Failed to update patient.');
    } finally {
      setSavingPatient(false);
    }
  };

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Intake, Triage & Vaccination"
        icon={Syringe}
        title={`Nurse Workspace — ${profile?.full_name || 'Nurse Camille Reyes'}`}
        subtitle="Walk-in patient registration (AES-256-GCM encrypted), nurse triage queue, and live PEP dose administration."
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
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Triage Queue"
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
          value={summary.todayDueDoses}
          hint="Scheduled PEP doses due today"
          loading={loading}
        />
        <KpiCard
          label="Completed Today"
          icon={Syringe}
          tone="mint"
          value={summary.todayCompletedDoses}
          hint="PEP doses administered today"
          loading={loading}
        />
        <KpiCard
          label="Missed / Overdue"
          icon={AlertTriangle}
          tone="red"
          value={summary.missedDoses}
          hint="Past-due or missed PEP doses"
          loading={loading}
        />
      </div>

      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label="Nurse workspace sections"
        className="flex flex-wrap items-center gap-2 border-b border-[#DDDCD4] pb-3"
      >
        {[
          {
            id: 'triage',
            label: `Triage Queue (${queuedNurseCases.length})`,
            icon: ClipboardList,
          },
          {
            id: 'doses',
            label: `PEP Doses & Vaccination Schedule (${doses.length})`,
            icon: Syringe,
          },
          {
            id: 'patients',
            label: `Branch Patients (${patients.length})`,
            icon: Users,
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

      {/* TAB 1: Triage Queue (`queued_nurse`) */}
      {activeTab === 'triage' && (
        <Panel
          title="Nurse Triage Queue (queued_nurse)"
          subtitle="Review walk-in wound findings, update nurse triage notes, and forward to the Doctor for WHO Category I–III assessment"
          action={
            <button
              type="button"
              onClick={() => setIntakeOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ New Walk-In Intake</span>
            </button>
          }
        >
          {queuedNurseCases.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No patients currently waiting in the nurse triage queue. Click '+ New Walk-In Intake' to register a walk-in patient."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Case #</Th>
                  <Th>Patient</Th>
                  <Th>Animal &amp; Wound Site</Th>
                  <Th>Exposure Date</Th>
                  <Th>Triage Notes</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {queuedNurseCases.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-mono text-xs font-bold">{c.case_number}</Td>
                    <Td>
                      <p className="font-bold">{c.patient?.full_name || 'Walk-In Patient'}</p>
                      <p className="text-[11px] text-[#464B71]/70">
                        {c.patient?.patient_code} • {c.patient?.phone || 'No phone'}
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
                      <div className="inline-flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditTriageModal(c)}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[#DDDCD4] bg-white px-2.5 py-1 text-xs font-extrabold text-[#464B71] hover:bg-[#F2F2ED]"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-[#118AB2]" />
                          <span>Edit Notes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleForwardToDoctor(c)}
                          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#118AB2] px-3 py-1 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                        >
                          <span>Forward to Doctor</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      )}

      {/* TAB 2: Today's PEP Doses / Vaccination Schedule */}
      {activeTab === 'doses' && (
        <Panel
          title="PEP Vaccination Schedule & Dose Administration"
          subtitle="Select a vaccine batch to administer scheduled doses (auto-decrements branch inventory) or reschedule missed visits"
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {[
              { id: 'today', label: `Today (${today})` },
              { id: 'upcoming', label: 'Today & Upcoming' },
              { id: 'all', label: `All Doses (${doses.length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDoseDateFilter(f.id)}
                className={`min-h-[36px] rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
                  doseDateFilter === f.id
                    ? 'bg-[#464B71] text-[#7CD5C7]'
                    : 'bg-[#F2F2ED] text-[#464B71] hover:bg-[#DDDCD4]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredDoses.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No PEP doses found for this date filter. Switch to 'All Doses' or approve a new case in the Doctor dashboard."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Case #</Th>
                  <Th>Patient</Th>
                  <Th>Dose Milestone</Th>
                  <Th>Scheduled Date</Th>
                  <Th>Vaccine / Lot</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {filteredDoses.map((d) => (
                  <tr key={d.id}>
                    <Td className="font-mono text-xs font-bold">{d.case_number}</Td>
                    <Td>
                      <p className="font-bold">{d.patient?.full_name || 'Patient'}</p>
                      <p className="text-[11px] text-[#464B71]/70">
                        {d.patient?.patient_code}
                      </p>
                    </Td>
                    <Td className="font-extrabold">Day {d.dose_day}</Td>
                    <Td className="whitespace-nowrap">{d.scheduled_date}</Td>
                    <Td className="text-xs">
                      <span className="font-semibold">{d.vaccine_brand || 'Speeda PVRV'}</span>
                      {d.lot_number ? ` • ${d.lot_number}` : ''}
                    </Td>
                    <Td>
                      <StatusPill tone={DOSE_TONE[d.status] || 'navy'}>
                        {d.status}
                      </StatusPill>
                    </Td>
                    <Td>
                      {d.status !== 'completed' ? (
                        <div className="inline-flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openAdministerModal(d)}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[#7CD5C7] px-3 py-1 text-xs font-extrabold text-[#464B71] hover:bg-[#68c7b8]"
                          >
                            <Syringe className="h-3.5 w-3.5" />
                            <span>Administer Dose</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openRescheduleModal(d)}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[#DDDCD4] bg-white px-2.5 py-1 text-xs font-extrabold text-[#464B71] hover:bg-[#F2F2ED]"
                          >
                            <span>Reschedule / Missed</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700">
                          Completed{' '}
                          {d.administered_at
                            ? `(${new Date(d.administered_at).toLocaleDateString('en-PH')})`
                            : ''}
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      )}

      {/* TAB 3: Branch Patients */}
      {activeTab === 'patients' && (
        <Panel
          title={`Branch Patient Registry — ${activeBranch?.shortName || branchId}`}
          subtitle="Decrypted patient records and clinical case counts (encrypted at rest with AES-256-GCM)"
          action={
            <button
              type="button"
              onClick={() => setIntakeOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>+ Register Walk-In</span>
            </button>
          }
        >
          <div className="mb-4 relative">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#464B71]/50" />
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Live search patients by full name, patient code (e.g. PT-SM-...), phone, or address..."
              aria-label="Search branch patients"
              className="min-h-[44px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 py-2 pl-10 pr-3 text-sm font-semibold text-[#464B71] focus:border-[#118AB2] focus:bg-white focus:outline-none"
            />
          </div>

          {filteredPatients.length === 0 ? (
            <EmptyState
              loading={loading}
              message="No patients matched your search query."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Patient Code</Th>
                  <Th>Full Name</Th>
                  <Th>Age / Sex</Th>
                  <Th>Phone</Th>
                  <Th>Address</Th>
                  <Th>Cases</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {filteredPatients.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-mono text-xs font-bold">{p.patient_code}</Td>
                    <Td className="font-extrabold">{p.full_name}</Td>
                    <Td className="capitalize">
                      {p.age ?? '—'} • {p.sex || '—'}
                    </Td>
                    <Td>{p.phone || '—'}</Td>
                    <Td className="max-w-xs truncate">{p.address || '—'}</Td>
                    <Td>
                      <StatusPill tone="blue">{p.cases_count || 0} case(s)</StatusPill>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => openEditPatientModal(p)}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-[#DDDCD4] bg-white px-2.5 py-1 text-xs font-extrabold text-[#464B71] hover:bg-[#F2F2ED]"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-[#118AB2]" />
                        <span>Edit</span>
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      )}

      {/* Modal 1: Walk-In Patient Registration & Triage */}
      {intakeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Walk-In Patient Registration and Triage"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#343857]/70 p-4"
        >
          <div className="w-full max-w-lg rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#464B71]">
                  Walk-In Patient Registration &amp; Triage
                </h2>
                <p className="text-xs text-[#464B71]/75">
                  Encrypts patient PII with AES-256-GCM and creates a clinical case.
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
                    Full Name *
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
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={intakeForm.phone}
                    onChange={(e) =>
                      setIntakeForm({ ...intakeForm, phone: e.target.value })
                    }
                    placeholder="09171234567"
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
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
                <div>
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
                <div>
                  <label className="block font-extrabold text-[#464B71]">
                    Animal Type *
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
                    Wound Site *
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

              <div>
                <label className="block font-extrabold text-[#464B71]">
                  Initial Nurse Triage Notes
                </label>
                <textarea
                  rows={2}
                  value={intakeForm.notes}
                  onChange={(e) =>
                    setIntakeForm({ ...intakeForm, notes: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 text-xs font-semibold text-[#464B71]"
                />
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
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 text-xs font-extrabold text-[#464B71]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIntake}
                  className="min-h-[42px] rounded-xl bg-[#118AB2] px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#0D6E8E] disabled:opacity-60"
                >
                  {submittingIntake ? 'Encrypting & Saving…' : 'Register Patient & Create Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Nurse Triage Notes */}
      {editingTriageCase && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Nurse Triage Notes"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#343857]/70 p-4"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#464B71]">
                  Update Triage Notes — {editingTriageCase.case_number}
                </h2>
                <p className="text-xs text-[#464B71]/75">
                  Patient: <strong>{editingTriageCase.patient?.full_name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTriageCase(null)}
                className="rounded-xl bg-[#F2F2ED] p-2 text-[#464B71]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTriageNotes} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-extrabold text-[#464B71]">Wound Site</label>
                <input
                  type="text"
                  required
                  value={triageWoundDraft}
                  onChange={(e) => setTriageWoundDraft(e.target.value)}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                />
              </div>
              <div>
                <label className="block font-extrabold text-[#464B71]">
                  Nurse Triage &amp; Vitals Notes
                </label>
                <textarea
                  rows={3}
                  value={triageNotesDraft}
                  onChange={(e) => setTriageNotesDraft(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 text-xs font-semibold text-[#464B71]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-[#F2F2ED] pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTriageCase(null)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 text-xs font-extrabold text-[#464B71]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTriage}
                  className="min-h-[42px] rounded-xl bg-[#118AB2] px-5 py-2 text-xs font-extrabold text-white"
                >
                  {savingTriage ? 'Saving…' : 'Save Triage Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Administer PEP Dose (Select Live Branch Vaccine Batch) */}
      {administeringDose && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Administer PEP Dose"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#343857]/70 p-4"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#464B71]">
                  Administer Day {administeringDose.dose_day} PEP Dose
                </h2>
                <p className="text-xs text-[#464B71]/75">
                  Patient: <strong>{administeringDose.patient?.full_name}</strong> ({administeringDose.case_number})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdministeringDose(null)}
                className="rounded-xl bg-[#F2F2ED] p-2 text-[#464B71]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdminister} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-extrabold text-[#464B71]">
                  Select Branch Vaccine Batch (Auto-Decrements 1 Vial) *
                </label>
                <select
                  value={selectedInventoryId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedInventoryId(id);
                    const found = vaccineBatches.find((b) => b.id === id);
                    if (found?.batch_number) setLotNumberDraft(found.batch_number);
                  }}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                >
                  {vaccineBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.item_name} — Batch {b.batch_number} ({b.stock_vials} vials left)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-[#464B71]">
                  Lot / Batch Number Recorded *
                </label>
                <input
                  type="text"
                  required
                  value={lotNumberDraft}
                  onChange={(e) => setLotNumberDraft(e.target.value)}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-mono text-xs font-semibold text-[#464B71]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#F2F2ED] pt-3">
                <button
                  type="button"
                  onClick={() => setAdministeringDose(null)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 text-xs font-extrabold text-[#464B71]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdminister}
                  className="min-h-[42px] rounded-xl bg-[#118AB2] px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#0D6E8E]"
                >
                  {savingAdminister ? 'Recording…' : 'Confirm Dose Administration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Reschedule or Mark Dose Missed */}
      {reschedulingDose && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reschedule or Mark Dose Missed"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#343857]/70 p-4"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#464B71]">
                  Reschedule or Mark Missed — Day {reschedulingDose.dose_day}
                </h2>
                <p className="text-xs text-[#464B71]/75">
                  Patient: <strong>{reschedulingDose.patient?.full_name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReschedulingDose(null)}
                className="rounded-xl bg-[#F2F2ED] p-2 text-[#464B71]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-extrabold text-[#464B71]">
                  New Target Scheduled Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F2F2ED] pt-3">
                <button
                  type="button"
                  disabled={savingReschedule}
                  onClick={() => handleSaveReschedule('missed')}
                  className="min-h-[42px] rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-extrabold text-red-700 hover:bg-red-100"
                >
                  Mark as Missed
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReschedulingDose(null)}
                    className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-3.5 py-2 text-xs font-extrabold text-[#464B71]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingReschedule}
                    onClick={() => handleSaveReschedule('scheduled')}
                    className="min-h-[42px] rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                  >
                    Save New Date
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Edit Encrypted Patient Info */}
      {editingPatient && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Patient Information"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#343857]/70 p-4"
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-[#7CD5C7] bg-white p-6 text-[#464B71] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F2ED] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#464B71]">
                  Edit Patient — {editingPatient.patient_code}
                </h2>
                <p className="text-xs text-[#464B71]/75">
                  Re-encrypted with AES-256-GCM before saving.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPatient(null)}
                className="rounded-xl bg-[#F2F2ED] p-2 text-[#464B71]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-extrabold text-[#464B71]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={patientForm.full_name}
                  onChange={(e) =>
                    setPatientForm({ ...patientForm, full_name: e.target.value })
                  }
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-[#464B71]">Phone</label>
                  <input
                    type="text"
                    value={patientForm.phone}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, phone: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-[#464B71]">Age</label>
                  <input
                    type="number"
                    value={patientForm.age}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, age: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-extrabold text-[#464B71]">Address</label>
                <input
                  type="text"
                  value={patientForm.address}
                  onChange={(e) =>
                    setPatientForm({ ...patientForm, address: e.target.value })
                  }
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 px-3 py-2 font-semibold text-[#464B71]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-[#F2F2ED] pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 text-xs font-extrabold text-[#464B71]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPatient}
                  className="min-h-[42px] rounded-xl bg-[#118AB2] px-5 py-2 text-xs font-extrabold text-white"
                >
                  {savingPatient ? 'Saving…' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

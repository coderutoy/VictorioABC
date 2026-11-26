import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Syringe,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  ClipboardList,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useBranch } from '../context/BranchContext';
import { useAuth, ROLES } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';

const WHO_CATEGORIES = [
  {
    value: 'I',
    title: 'Category I — No Exposure',
    description:
      'Touching or feeding animals, animal licks on intact skin (no skin break or mucous contact).',
    protocol: 'Thorough wound/skin washing & health education. No PEP vaccine or RIG required.',
    tone: 'emerald',
  },
  {
    value: 'II',
    title: 'Category II — Minor Exposure',
    description:
      'Nibbling of uncovered skin, minor scratches or abrasions without bleeding.',
    protocol: 'Immediate wound washing + Anti-Rabies Vaccine PEP schedule (Day 0, 3, 7, 14/28).',
    tone: 'amber',
  },
  {
    value: 'III',
    title: 'Category III — Severe / Transdermal Exposure',
    description:
      'Single or multiple transdermal bites/scratches, bleeding wounds, saliva on broken skin/mucosa, or bat exposure.',
    protocol:
      'Immediate wound washing + Anti-Rabies Vaccine PEP schedule + ERIG/HRIG wound infiltration.',
    tone: 'red',
  },
];

const VISIT_STATUS_TONE = {
  Waiting: 'amber',
  Triage: 'blue',
  'For Doctor Order': 'red',
  'For Vaccination': 'teal',
  Completed: 'emerald',
};

function addDays(baseDateStr, daysOffset) {
  if (!baseDateStr) return '';
  const [y, m, d] = baseDateStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(Date.UTC(y, m - 1, d + daysOffset));
  return dt.toISOString().slice(0, 10);
}

function previewPepDoses(day0DateStr, regimenType) {
  if (regimenType === 'booster') {
    return [
      { dose: 'Day 0', date: addDays(day0DateStr, 0) },
      { dose: 'Day 3', date: addDays(day0DateStr, 3) },
    ];
  }
  if (regimenType === 'ID') {
    return [
      { dose: 'Day 0', date: addDays(day0DateStr, 0) },
      { dose: 'Day 3', date: addDays(day0DateStr, 3) },
      { dose: 'Day 7', date: addDays(day0DateStr, 7) },
      { dose: 'Day 28', date: addDays(day0DateStr, 28) },
    ];
  }
  return [
    { dose: 'Day 0', date: addDays(day0DateStr, 0) },
    { dose: 'Day 3', date: addDays(day0DateStr, 3) },
    { dose: 'Day 7', date: addDays(day0DateStr, 7) },
    { dose: 'Day 14', date: addDays(day0DateStr, 14) },
    { dose: 'Day 28', date: addDays(day0DateStr, 28) },
  ];
}

export function ClinicalOrdersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { activeBranchId, activeBranch, canSwitchBranch } = useBranch();

  const canIssueOrders = role === ROLES.DOCTOR || role === ROLES.ADMIN;

  const [encounters, setEncounters] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState(null);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Doctor Clinical Encounter Form State
  const [orderForm, setOrderForm] = useState({
    doctor_validated_category: 'II',
    ai_override_reason: '',
    regimen_type: 'ID',
    day0_date: new Date().toISOString().slice(0, 10),
    generate_pep_schedule: true,
    erig_required: false,
    immunoglobulin_type: 'ERIG',
    erig_skin_test_result: 'pending',
    tetanus_required: true,
    tetanus_preparation: 'Tetanus Toxoid (TT) 0.5 mL IM',
    exposure_date: new Date().toISOString().slice(0, 10),
    animal_type: 'Dog',
    animal_status: 'stray',
    bite_site: '',
    animal_observation_status: 'under_observation',
    weight_kg: '',
    wound_type: 'bite',
    wound_depth: 'superficial',
    bleeding: false,
    multiple_wounds: false,
    wound_washed: true,
    instructions: 'Wash wound with soap and water for 15 mins. Observe biting animal for 14 days.',
    clinical_notes: '',
  });

  // Nurse Dose Administration Modal State
  const [administeringSchedule, setAdministeringSchedule] = useState(null);
  const [adminForm, setAdminForm] = useState({
    inventory_batch_id: '',
    erig_inventory_batch_id: '',
    tetanus_inventory_batch_id: '',
    erig_administered: false,
    tetanus_administered: false,
    doses_deducted: 1,
    injection_site: 'Both deltoids (0.1 mL ID per site)',
    administration_notes: 'Patient observed for 30 minutes post-vaccination; no immediate adverse reaction.',
    adverse_reactions: 'None',
  });
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  const scopeLabel = activeBranch
    ? activeBranch.name
    : canSwitchBranch
      ? 'All Branches (HQ)'
      : 'Assigned Branch';

  const populateFormFromCase = useCallback((c) => {
    if (!c) return;
    const ctx = c.clinical_context || {};
    const orderDetails = ctx.order_details || {};
    const latestOrder = c.clinical_orders?.[0] || {};
    const initialCat =
      c.doctor_validated_category || c.ai_suggested_category || 'II';

    setOrderForm({
      doctor_validated_category: initialCat,
      ai_override_reason: c.ai_override_reason || '',
      regimen_type: latestOrder.regimen_type || orderDetails.regimen_type || 'ID',
      day0_date:
        orderDetails.day0_date || new Date().toISOString().slice(0, 10),
      generate_pep_schedule:
        orderDetails.generate_pep_schedule !== undefined
          ? orderDetails.generate_pep_schedule
          : initialCat !== 'I',
      erig_required:
        latestOrder.erig_required !== undefined
          ? latestOrder.erig_required
          : initialCat === 'III',
      immunoglobulin_type: orderDetails.immunoglobulin_type || 'ERIG',
      erig_skin_test_result: orderDetails.erig_skin_test_result || 'pending',
      tetanus_required:
        latestOrder.tetanus_required !== undefined
          ? latestOrder.tetanus_required
          : initialCat !== 'I',
      tetanus_preparation:
        orderDetails.tetanus_preparation || 'Tetanus Toxoid (TT) 0.5 mL IM',
      exposure_date: c.exposure_date || new Date().toISOString().slice(0, 10),
      animal_type: c.animal_type || 'Dog',
      animal_status: c.animal_status || 'stray',
      bite_site: c.bite_site || '',
      animal_observation_status:
        c.animal_observation_status || 'under_observation',
      weight_kg: ctx.weight_kg ?? '',
      wound_type: ctx.wound_type || 'bite',
      wound_depth: ctx.wound_depth || 'superficial',
      bleeding: Boolean(ctx.bleeding),
      multiple_wounds: Boolean(ctx.multiple_wounds),
      wound_washed: ctx.wound_washed ?? true,
      instructions:
        latestOrder.instructions ||
        'Infiltrate ERIG around wound if Category III. Administer ARV per WHO PEP schedule.',
      clinical_notes: c.clinical_notes || '',
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activeBranchId) params.branch_id = activeBranchId;

      const [ordersRes, invRes] = await Promise.all([
        api.get('/clinical-orders', { params }),
        api.get('/inventory', { params: { ...params, available_only: 'true' } }),
      ]);

      const list = ordersRes.data?.data || [];
      setEncounters(list);
      setInventory(invRes.data?.data || []);

      const requestedCaseId = searchParams.get('case_id');
      if (requestedCaseId) {
        const match = list.find((item) => item.id === requestedCaseId);
        if (match) {
          setSelectedCase(match);
          populateFormFromCase(match);
          return;
        }
      }

      setSelectedCase((prev) => {
        if (prev) {
          const refreshed = list.find((item) => item.id === prev.id);
          if (refreshed) return refreshed;
        }
        const firstPending =
          list.find((item) => item.visit_status === 'For Doctor Order') ||
          list.find((item) => item.visit_status === 'For Vaccination') ||
          list[0] ||
          null;
        if (firstPending) populateFormFromCase(firstPending);
        return firstPending;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clinical encounters.');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId, searchParams, populateFormFromCase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectCategory = (cat) => {
    setOrderForm((prev) => ({
      ...prev,
      doctor_validated_category: cat,
      generate_pep_schedule: cat !== 'I',
      erig_required: cat === 'III',
      tetanus_required: cat !== 'I',
    }));
  };

  const calculatedIgIu = useMemo(() => {
    const w = Number(orderForm.weight_kg);
    if (!orderForm.erig_required || !w || w <= 0) return null;
    const factor = orderForm.immunoglobulin_type === 'HRIG' ? 20 : 40;
    return Math.round(w * factor);
  }, [orderForm.erig_required, orderForm.weight_kg, orderForm.immunoglobulin_type]);

  const schedulePreview = useMemo(() => {
    if (!orderForm.generate_pep_schedule) return [];
    return previewPepDoses(orderForm.day0_date, orderForm.regimen_type);
  }, [orderForm.generate_pep_schedule, orderForm.day0_date, orderForm.regimen_type]);

  const handleSubmitClinicalOrder = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    setSubmittingOrder(true);
    setError('');
    try {
      const payload = {
        case_id: selectedCase.id,
        doctor_validated_category: orderForm.doctor_validated_category,
        ai_override_reason: orderForm.ai_override_reason.trim() || null,
        regimen_type: orderForm.regimen_type,
        day0_date: orderForm.day0_date,
        generate_pep_schedule: Boolean(orderForm.generate_pep_schedule),
        erig_required: Boolean(orderForm.erig_required),
        immunoglobulin_type: orderForm.erig_required
          ? orderForm.immunoglobulin_type
          : 'none',
        erig_skin_test_result: orderForm.erig_skin_test_result,
        tetanus_required: Boolean(orderForm.tetanus_required),
        tetanus_preparation: orderForm.tetanus_required
          ? orderForm.tetanus_preparation
          : 'none',
        exposure_date: orderForm.exposure_date,
        animal_type: orderForm.animal_type,
        animal_status: orderForm.animal_status,
        bite_site: orderForm.bite_site,
        animal_observation_status: orderForm.animal_observation_status,
        weight_kg: orderForm.weight_kg ? Number(orderForm.weight_kg) : null,
        wound_type: orderForm.wound_type,
        wound_depth: orderForm.wound_depth,
        bleeding: Boolean(orderForm.bleeding),
        multiple_wounds: Boolean(orderForm.multiple_wounds),
        wound_washed: Boolean(orderForm.wound_washed),
        instructions: orderForm.instructions,
        clinical_notes: orderForm.clinical_notes,
      };

      const res = await api.post('/clinical-orders', payload);
      const updated = res.data?.data;
      setBanner(
        `Clinical Order issued for ${updated?.patient?.full_name}: WHO Category ${updated?.doctor_validated_category}, ${updated?.pep_schedules?.length || 0} PEP doses scheduled. Visit status: "${updated?.visit_status}".`
      );
      setSelectedCase(updated);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue clinical order.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const antiRabiesBatches = useMemo(
    () => inventory.filter((b) => b.item_type === 'anti_rabies'),
    [inventory]
  );
  const erigBatches = useMemo(
    () => inventory.filter((b) => b.item_type === 'erig'),
    [inventory]
  );
  const tetanusBatches = useMemo(
    () => inventory.filter((b) => b.item_type === 'tetanus'),
    [inventory]
  );

  const openAdministerModal = (schedule) => {
    const latestOrder = selectedCase?.clinical_orders?.[0];
    setAdministeringSchedule(schedule);
    setAdminForm({
      inventory_batch_id: antiRabiesBatches[0]?.id || '',
      erig_inventory_batch_id: '',
      tetanus_inventory_batch_id: '',
      erig_administered: Boolean(latestOrder?.erig_required && schedule.dose_number === 'Day 0'),
      tetanus_administered: Boolean(
        latestOrder?.tetanus_required && schedule.dose_number === 'Day 0'
      ),
      doses_deducted: 1,
      injection_site:
        latestOrder?.regimen_type === 'IM'
          ? 'Deltoid muscle (1.0 mL IM)'
          : 'Both deltoids (0.1 mL ID per site)',
      administration_notes:
        'Patient observed for 30 minutes post-vaccination; no immediate adverse reaction.',
      adverse_reactions: 'None',
    });
  };

  const handleConfirmAdministration = async (e) => {
    e.preventDefault();
    if (!administeringSchedule) return;
    setSubmittingAdmin(true);
    setError('');
    try {
      await api.post(`/schedules/${administeringSchedule.id}/administer`, {
        inventory_batch_id: adminForm.inventory_batch_id || null,
        erig_inventory_batch_id: adminForm.erig_inventory_batch_id || null,
        tetanus_inventory_batch_id: adminForm.tetanus_inventory_batch_id || null,
        erig_administered: Boolean(adminForm.erig_administered),
        tetanus_administered: Boolean(adminForm.tetanus_administered),
        doses_deducted: Number(adminForm.doses_deducted) || 1,
        injection_site: adminForm.injection_site,
        administration_notes: adminForm.administration_notes,
        adverse_reactions: adminForm.adverse_reactions,
      });

      setBanner(
        `Dose ${administeringSchedule.dose_number} administered & inventory batch stock deducted. Patient visit status updated to "Completed".`
      );
      setAdministeringSchedule(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record dose administration.');
    } finally {
      setSubmittingAdmin(false);
    }
  };

  const filteredEncounters = useMemo(() => {
    if (statusFilter === 'ALL') return encounters;
    return encounters.filter((c) => c.visit_status === statusFilter);
  }, [encounters, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Doctor Clinical Orders &amp; Vaccination Fulfillment
            </h1>
            <Badge tone="teal">Scope: {scopeLabel}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            WHO Rabies Category I-III validation, automated PEP schedule generation, ERIG/HRIG &amp; Tetanus orders, and nurse administration tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button variant="secondary" onClick={() => navigate('/schedules')}>
            <CalendarClock className="h-4 w-4" />
            <span>All PEP Schedules</span>
          </Button>
        </div>
      </div>

      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span>{banner}</span>
          <button type="button" onClick={() => setBanner('')}>
            <X className="h-4 w-4 text-emerald-700" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading clinical encounters..." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Active Encounter Queue List */}
          <div className="lg:col-span-4 space-y-4">
            <Card
              title={`Clinical Queue (${filteredEncounters.length})`}
              subtitle="Select a patient encounter to prescribe or administer PEP."
            >
              <div className="mb-3 flex flex-wrap gap-1.5">
                {['ALL', 'For Doctor Order', 'For Vaccination', 'Triage', 'Completed'].map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        statusFilter === tab
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>

              {filteredEncounters.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  No encounters matching filter &ldquo;{statusFilter}&rdquo;.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[68vh] overflow-y-auto pr-1">
                  {filteredEncounters.map((c) => {
                    const isSelected = selectedCase?.id === c.id;
                    const cat = c.doctor_validated_category || c.ai_suggested_category;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCase(c);
                          populateFormFromCase(c);
                        }}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-200'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            {c.patient?.full_name || 'Unknown Patient'}
                          </span>
                          <Badge tone={VISIT_STATUS_TONE[c.visit_status] || 'slate'}>
                            {c.visit_status}
                          </Badge>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                          <span className="font-mono text-[11px] font-bold text-slate-800">
                            {c.clinical_context?.queue_number || 'WALK-IN'}
                          </span>
                          <span>&bull; {c.animal_type}</span>
                          <span>&bull; {c.bite_site}</span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Exposed: {c.exposure_date}</span>
                          {cat && (
                            <span className="font-semibold text-slate-700">
                              WHO Cat {cat}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Doctor Clinical Encounter Form + Nurse Administration Tracking */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedCase ? (
              <Card
                title="No Patient Encounter Selected"
                subtitle="Choose a patient from the Clinical Queue on the left or check in a patient via QR Check-In."
              >
                <Button variant="primary" onClick={() => navigate('/triage')}>
                  Go to QR Check-In &amp; Triage Queue
                </Button>
              </Card>
            ) : (
              <>
                {/* Selected Patient Header Card */}
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                          {selectedCase.clinical_context?.queue_number || 'VISIT'}
                        </span>
                        <h2 className="text-lg font-bold text-slate-900">
                          {selectedCase.patient?.full_name}
                        </h2>
                        <code className="rounded bg-brand-50 px-2 py-0.5 font-mono text-xs font-semibold text-brand-700">
                          {selectedCase.patient?.qr_code_hash}
                        </code>
                        <Badge tone={VISIT_STATUS_TONE[selectedCase.visit_status] || 'slate'}>
                          {selectedCase.visit_status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        DOB: {selectedCase.patient?.birthdate} ({selectedCase.patient?.gender}) &bull; Phone:{' '}
                        {selectedCase.patient?.phone || 'N/A'} &bull; Address:{' '}
                        {selectedCase.patient?.address}, Brgy. {selectedCase.patient?.barangay}
                      </p>
                    </div>

                    {selectedCase.ai_suggested_category && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
                        <span className="font-semibold">
                          Triage / AI Suggestion: Category {selectedCase.ai_suggested_category}
                        </span>
                        {selectedCase.ai_confidence && (
                          <span className="ml-1">
                            ({Math.round(Number(selectedCase.ai_confidence) * 100)}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Nurse Administration Tracking Panel (when order exists / PEP schedules exist) */}
                {selectedCase.pep_schedules?.length > 0 && (
                  <Card
                    title="Nurse PEP Vaccination & RIG Administration Tracking"
                    subtitle="Administer scheduled doses (Day 0, Day 3, Day 7, Day 14/28), record batch numbers, and auto-deduct branch inventory."
                  >
                    {selectedCase.clinical_orders?.[0] && (
                      <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 text-xs text-slate-800 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-brand-900">
                            Active Doctor Order: WHO Category{' '}
                            {selectedCase.doctor_validated_category} &bull; Regimen:{' '}
                            {selectedCase.clinical_orders[0].regimen_type}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge
                              tone={
                                selectedCase.clinical_orders[0].erig_required
                                  ? 'red'
                                  : 'slate'
                              }
                            >
                              ERIG/HRIG:{' '}
                              {selectedCase.clinical_orders[0].erig_required
                                ? `ORDERED (${selectedCase.clinical_context?.order_details?.calculated_ig_iu || '40 IU/kg'} IU)`
                                : 'Not Required'}
                            </Badge>
                            <Badge
                              tone={
                                selectedCase.clinical_orders[0].tetanus_required
                                  ? 'amber'
                                  : 'slate'
                              }
                            >
                              Tetanus:{' '}
                              {selectedCase.clinical_orders[0].tetanus_required
                                ? 'ORDERED'
                                : 'Not Required'}
                            </Badge>
                          </div>
                        </div>
                        {selectedCase.clinical_orders[0].instructions && (
                          <p className="text-slate-600">
                            <strong>Doctor Instructions:</strong>{' '}
                            {selectedCase.clinical_orders[0].instructions}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {selectedCase.pep_schedules.map((sched) => {
                        const isDone = sched.status === 'completed';
                        return (
                          <div
                            key={sched.id}
                            className={`flex flex-col justify-between rounded-xl border p-3.5 ${
                              isDone
                                ? 'border-emerald-200 bg-emerald-50/70'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-900">
                                  {sched.dose_number}
                                </span>
                                <Badge tone={isDone ? 'emerald' : 'amber'}>
                                  {sched.status.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs font-medium text-slate-600">
                                Target: {sched.scheduled_date}
                              </p>
                              {isDone && (
                                <p className="mt-1 text-[11px] text-emerald-800">
                                  Administered:{' '}
                                  {new Date(sched.administered_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            {!isDone && (
                              <div className="mt-3">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => openAdministerModal(sched)}
                                >
                                  <Syringe className="h-3.5 w-3.5" />
                                  <span>Administer {sched.dose_number}</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Doctor Clinical Encounter & Order Form */}
                <Card
                  title="Doctor Clinical Encounter & Prescription Form"
                  subtitle={
                    canIssueOrders
                      ? 'Classify WHO Rabies Exposure Category, verify wound findings, and generate automated PEP schedule.'
                      : 'Read-only preview for Nurse role. Only licensed Doctors or Central Admin can submit clinical orders.'
                  }
                >
                  <form onSubmit={handleSubmitClinicalOrder} className="space-y-5">
                    {/* 1. WHO Rabies Exposure Category Cards */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-900">
                        1. WHO Rabies Exposure Category Classification *
                      </label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {WHO_CATEGORIES.map((cat) => {
                          const active =
                            orderForm.doctor_validated_category === cat.value;
                          return (
                            <button
                              key={cat.value}
                              type="button"
                              disabled={!canIssueOrders}
                              onClick={() => handleSelectCategory(cat.value)}
                              className={`rounded-xl border p-3.5 text-left transition ${
                                active
                                  ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-200'
                                  : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-900">
                                  Category {cat.value}
                                </span>
                                <Badge tone={cat.tone}>WHO Cat {cat.value}</Badge>
                              </div>
                              <p className="mt-1.5 text-xs text-slate-600">
                                {cat.description}
                              </p>
                              <p className="mt-2 text-[11px] font-medium text-slate-800">
                                {cat.protocol}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedCase.ai_suggested_category &&
                      selectedCase.ai_suggested_category !==
                        orderForm.doctor_validated_category && (
                        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5">
                          <Input
                            id="ai_override_reason"
                            label={`Clinical Override Reason * (Overriding Suggested Category ${selectedCase.ai_suggested_category} -> Category ${orderForm.doctor_validated_category})`}
                            required
                            placeholder="e.g. Physical exam confirmed transdermal puncture with bleeding upon provocation"
                            value={orderForm.ai_override_reason}
                            onChange={(e) =>
                              setOrderForm({
                                ...orderForm,
                                ai_override_reason: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}

                    {/* 2. Wound Assessment & Animal Details */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">
                        2. Wound Assessment &amp; Biting Animal Profile
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-4">
                        <Input
                          id="order_exposure_date"
                          label="Exposure Date"
                          type="date"
                          disabled={!canIssueOrders}
                          value={orderForm.exposure_date}
                          onChange={(e) =>
                            setOrderForm({
                              ...orderForm,
                              exposure_date: e.target.value,
                            })
                          }
                        />
                        <Input
                          id="order_animal_type"
                          label="Animal Type"
                          disabled={!canIssueOrders}
                          value={orderForm.animal_type}
                          onChange={(e) =>
                            setOrderForm({ ...orderForm, animal_type: e.target.value })
                          }
                        />
                        <Input
                          id="order_bite_site"
                          label="Bite Site"
                          disabled={!canIssueOrders}
                          value={orderForm.bite_site}
                          onChange={(e) =>
                            setOrderForm({ ...orderForm, bite_site: e.target.value })
                          }
                        />
                        <Input
                          id="order_weight_kg"
                          label="Patient Weight (kg)"
                          type="number"
                          step="0.1"
                          disabled={!canIssueOrders}
                          placeholder="e.g. 60"
                          value={orderForm.weight_kg}
                          onChange={(e) =>
                            setOrderForm({ ...orderForm, weight_kg: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-slate-700">
                            Wound Type
                          </label>
                          <select
                            disabled={!canIssueOrders}
                            value={orderForm.wound_type}
                            onChange={(e) =>
                              setOrderForm({ ...orderForm, wound_type: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                          >
                            <option value="bite">Bite / Puncture</option>
                            <option value="scratch">Scratch / Abrasion</option>
                            <option value="lick_broken_skin">Saliva on Broken Skin / Mucosa</option>
                            <option value="intact_skin_contact">Intact Skin Contact</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-slate-700">
                            Wound Depth
                          </label>
                          <select
                            disabled={!canIssueOrders}
                            value={orderForm.wound_depth}
                            onChange={(e) =>
                              setOrderForm({ ...orderForm, wound_depth: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                          >
                            <option value="intact">Intact Skin</option>
                            <option value="superficial">Superficial</option>
                            <option value="deep_transdermal">Deep / Transdermal</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-slate-700">
                            14-Day Animal Observation
                          </label>
                          <select
                            disabled={!canIssueOrders}
                            value={orderForm.animal_observation_status}
                            onChange={(e) =>
                              setOrderForm({
                                ...orderForm,
                                animal_observation_status: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                          >
                            <option value="under_observation">Under 14-Day Observation</option>
                            <option value="alive_healthy">Alive &amp; Healthy</option>
                            <option value="lost_stray">Lost / Unobservable Stray</option>
                            <option value="died">Animal Died</option>
                            <option value="killed_tested">Killed / Tested</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 3. Automated PEP Vaccination Schedule Generator */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          3. Automated PEP Vaccination Schedule Generation
                        </h3>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!canIssueOrders}
                            checked={orderForm.generate_pep_schedule}
                            onChange={(e) =>
                              setOrderForm({
                                ...orderForm,
                                generate_pep_schedule: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-brand-600"
                          />
                          <span>Generate Multi-Dose PEP Schedule</span>
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-slate-700">
                            WHO Anti-Rabies Regimen Type *
                          </label>
                          <select
                            disabled={!canIssueOrders}
                            value={orderForm.regimen_type}
                            onChange={(e) =>
                              setOrderForm({
                                ...orderForm,
                                regimen_type: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                          >
                            <option value="ID">
                              Intradermal (ID) — Thai Red Cross (Day 0, Day 3, Day 7, Day 28)
                            </option>
                            <option value="IM">
                              Intramuscular (IM) — Essen 5-Dose (Day 0, Day 3, Day 7, Day 14, Day 28)
                            </option>
                            <option value="booster">
                              Booster Regimen — Previously Immunized (Day 0, Day 3)
                            </option>
                          </select>
                        </div>

                        <Input
                          id="day0_date"
                          label="Day 0 Initiation Date *"
                          type="date"
                          disabled={!canIssueOrders || !orderForm.generate_pep_schedule}
                          value={orderForm.day0_date}
                          onChange={(e) =>
                            setOrderForm({ ...orderForm, day0_date: e.target.value })
                          }
                        />
                      </div>

                      {schedulePreview.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-600">
                            Auto-Generated PEP Schedule Dates Preview:
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {schedulePreview.map((d) => (
                              <div
                                key={d.dose}
                                className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs shadow-sm"
                              >
                                <span className="font-bold text-brand-700">{d.dose}:</span>{' '}
                                <span className="font-medium text-slate-900">{d.date}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. ERIG/HRIG & Tetanus Toxoid Orders */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm font-semibold text-slate-900">
                            ERIG / HRIG Immunoglobulin Order
                          </span>
                          <input
                            type="checkbox"
                            disabled={!canIssueOrders}
                            checked={orderForm.erig_required}
                            onChange={(e) =>
                              setOrderForm({
                                ...orderForm,
                                erig_required: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-brand-600"
                          />
                        </label>

                        {orderForm.erig_required && (
                          <div className="space-y-2.5 text-xs">
                            <div>
                              <label className="block font-medium text-slate-700">
                                Immunoglobulin Preparation
                              </label>
                              <select
                                disabled={!canIssueOrders}
                                value={orderForm.immunoglobulin_type}
                                onChange={(e) =>
                                  setOrderForm({
                                    ...orderForm,
                                    immunoglobulin_type: e.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                              >
                                <option value="ERIG">
                                  ERIG — Equine Rabies Immunoglobulin (40 IU/kg)
                                </option>
                                <option value="HRIG">
                                  HRIG — Human Rabies Immunoglobulin (20 IU/kg)
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-medium text-slate-700">
                                Skin Test Status (Required for ERIG)
                              </label>
                              <select
                                disabled={!canIssueOrders}
                                value={orderForm.erig_skin_test_result}
                                onChange={(e) =>
                                  setOrderForm({
                                    ...orderForm,
                                    erig_skin_test_result: e.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                              >
                                <option value="pending">Pending Skin Test</option>
                                <option value="negative">Negative (Proceed with ERIG)</option>
                                <option value="positive">
                                  Positive (Switch to HRIG / Precaution)
                                </option>
                              </select>
                            </div>

                            {calculatedIgIu && (
                              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                                Calculated Max Dose: {calculatedIgIu} IU (for{' '}
                                {orderForm.weight_kg} kg body weight)
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm font-semibold text-slate-900">
                            Anti-Tetanus Prophylaxis Order
                          </span>
                          <input
                            type="checkbox"
                            disabled={!canIssueOrders}
                            checked={orderForm.tetanus_required}
                            onChange={(e) =>
                              setOrderForm({
                                ...orderForm,
                                tetanus_required: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-brand-600"
                          />
                        </label>

                        {orderForm.tetanus_required && (
                          <div className="space-y-2.5 text-xs">
                            <div>
                              <label className="block font-medium text-slate-700">
                                Tetanus Preparation &amp; Dose
                              </label>
                              <select
                                disabled={!canIssueOrders}
                                value={orderForm.tetanus_preparation}
                                onChange={(e) =>
                                  setOrderForm({
                                    ...orderForm,
                                    tetanus_preparation: e.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                              >
                                <option value="Tetanus Toxoid (TT) 0.5 mL IM">
                                  Tetanus Toxoid (TT) — 0.5 mL IM
                                </option>
                                <option value="ATS 1500 IU + TT 0.5 mL IM">
                                  Anti-Tetanus Serum (ATS 1,500 IU) + TT 0.5 mL IM
                                </option>
                                <option value="HTIG 250 IU + TT 0.5 mL IM">
                                  Human Tetanus Immunoglobulin (HTIG 250 IU) + TT 0.5 mL IM
                                </option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. Instructions & Clinical Notes */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-700">
                          Nurse Administration &amp; Wound Care Instructions
                        </label>
                        <textarea
                          rows={2}
                          disabled={!canIssueOrders}
                          value={orderForm.instructions}
                          onChange={(e) =>
                            setOrderForm({ ...orderForm, instructions: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-700">
                          Physician Clinical Assessment Notes
                        </label>
                        <textarea
                          rows={2}
                          disabled={!canIssueOrders}
                          value={orderForm.clinical_notes}
                          onChange={(e) =>
                            setOrderForm({
                              ...orderForm,
                              clinical_notes: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        />
                      </div>
                    </div>

                    {canIssueOrders && (
                      <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={submittingOrder}
                        >
                          <Stethoscope className="h-4 w-4" />
                          <span>
                            {submittingOrder
                              ? 'Issuing Clinical Order & Generating PEP Schedule...'
                              : 'Sign Clinical Order & Generate PEP Schedule'}
                          </span>
                        </Button>
                      </div>
                    )}
                  </form>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {/* Nurse Dose Administration Modal */}
      {administeringSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Administer PEP Dose — {administeringSchedule.dose_number}
                </h2>
                <p className="text-xs text-slate-500">
                  Patient: {selectedCase?.patient?.full_name} &bull; Scheduled:{' '}
                  {administeringSchedule.scheduled_date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdministeringSchedule(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdministration} className="space-y-4 p-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Anti-Rabies Vaccine Batch (FEFO Auto-Selected) *
                </label>
                <select
                  required
                  value={adminForm.inventory_batch_id}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, inventory_batch_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {antiRabiesBatches.length === 0 ? (
                    <option value="">Auto-Select Branch Batch</option>
                  ) : (
                    antiRabiesBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.vaccine_name} — Batch {b.batch_number} ({b.quantity_remaining} left, Exp:{' '}
                        {b.expiration_date})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {erigBatches.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    ERIG Batch (Optional Stock Deduction)
                  </label>
                  <select
                    value={adminForm.erig_inventory_batch_id}
                    onChange={(e) =>
                      setAdminForm({
                        ...adminForm,
                        erig_inventory_batch_id: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="">None / Not Deducting Separate ERIG Batch</option>
                    {erigBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.vaccine_name} — Batch {b.batch_number} ({b.quantity_remaining} left)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {tetanusBatches.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Tetanus Toxoid Batch (Optional Stock Deduction)
                  </label>
                  <select
                    value={adminForm.tetanus_inventory_batch_id}
                    onChange={(e) =>
                      setAdminForm({
                        ...adminForm,
                        tetanus_inventory_batch_id: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="">None / Not Deducting Separate Tetanus Batch</option>
                    {tetanusBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.vaccine_name} — Batch {b.batch_number} ({b.quantity_remaining} left)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="injection_site"
                  label="Anatomical Injection Site & Route"
                  value={adminForm.injection_site}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, injection_site: e.target.value })
                  }
                />
                <Input
                  id="doses_deducted"
                  label="Inventory Units Deducted"
                  type="number"
                  min={1}
                  value={adminForm.doses_deducted}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, doses_deducted: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminForm.erig_administered}
                    onChange={(e) =>
                      setAdminForm({
                        ...adminForm,
                        erig_administered: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  <span>ERIG / HRIG Infiltrated Around Wound</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminForm.tetanus_administered}
                    onChange={(e) =>
                      setAdminForm({
                        ...adminForm,
                        tetanus_administered: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  <span>Tetanus Toxoid (TT) Administered</span>
                </label>
              </div>

              <Input
                id="adverse_reactions"
                label="30-Minute Post-Vaccination Adverse Reaction Check"
                value={adminForm.adverse_reactions}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, adverse_reactions: e.target.value })
                }
              />

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setAdministeringSchedule(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submittingAdmin}>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {submittingAdmin
                      ? 'Recording & Deducting Stock...'
                      : 'Confirm Dose Administration'}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Timer,
  Users,
  Syringe,
  ThermometerSnowflake,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  PhoneCall,
  Send,
  X,
  FlaskConical,
  Stamp,
  CalendarClock,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { getBranchBySlug, formatBranchLabel } from '../../config/branches';
import { WorkspaceSkeleton } from '../../components/ui/BufferLoader';

function formatCountdown(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const NURSE_TABS = [
  { id: 'vials', label: '6-Hr Open-Vial & Queue Optimizer', icon: Timer },
  { id: 'triage', label: 'Walk-In Triage & Boosters', icon: Users },
  { id: 'fefo', label: 'FEFO Dose Administration', icon: Syringe },
  { id: 'defaulters', label: 'Cat III Defaulters & Cold-Chain', icon: ThermometerSnowflake },
];

export function NurseDashboardPage() {
  const { profile } = useAuth();
  const outletCtx = useOutletContext() || {};
  const isDark = Boolean(outletCtx.isDark);
  const activeTab = outletCtx.activeTab || 'vials';
  const setSearchParams = outletCtx.setSearchParams;

  const assignedBranch = getBranchBySlug(profile?.branch_id || 'santa-maria');
  const branchLabel = formatBranchLabel(assignedBranch);
  const nursePrc = profile?.prc_license_number || profile?.license_number || 'PRC-0892341';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Live 1-second tick for 6-hour open-vial countdown timers
  const [nowTick, setNowTick] = useState(Date.now());

  // Open new vial modal state
  const [openVialModal, setOpenVialModal] = useState(false);
  const [selectedBatchForVial, setSelectedBatchForVial] = useState('');
  const [vialDoseCap, setVialDoseCap] = useState(5);
  const [vialSubmitting, setVialSubmitting] = useState(false);

  // Walk-in registration modal state
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    age: 28,
    sex: 'male',
    animal_type: 'dog',
    wound_site: 'Right Hand',
    notes: 'Walk-in wound washed with soap and running water for 15 minutes.',
    forward_to_doctor: true,
  });

  // FEFO dose administration state
  const [administeringId, setAdministeringId] = useState(null);
  const [selectedFefoBatchId, setSelectedFefoBatchId] = useState('');
  const [selectedActiveVialId, setSelectedActiveVialId] = useState('');

  // Defaulter call modal state
  const [callTargetDose, setCallTargetDose] = useState(null);
  const [callForm, setCallForm] = useState({
    outcome: 'Reached — Confirmed Afternoon Arrival',
    notes: '',
    reschedule_date: '',
  });
  const [callSubmitting, setCallSubmitting] = useState(false);

  // Cold-Chain shift form state
  const [coldForm, setColdForm] = useState({
    temperature_c: '4.4',
    shift_label: 'Afternoon Shift Check (02:00 PM)',
  });
  const [coldSubmitting, setColdSubmitting] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/nurse/workspace');
      const payload = res?.data?.data || null;
      setData(payload);

      if (payload?.fefoInventory?.length > 0) {
        const recBatch =
          payload.fefoInventory.find(
            (i) => i.category === 'vaccine' && i.isRecommendedFefo
          ) || payload.fefoInventory.find((i) => i.category === 'vaccine');
        if (recBatch) {
          setSelectedBatchForVial(recBatch.id);
          setSelectedFefoBatchId(recBatch.id);
        }
      }
      if (payload?.activeVials?.length > 0) {
        setSelectedActiveVialId(payload.activeVials[0].id);
      } else {
        setSelectedActiveVialId('');
      }
    } catch (err) {
      setError(
        err?.userMessage ||
          err?.message ||
          'Failed to load branch-locked Nurse Workspace from live Supabase.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const switchTab = (tabId) => {
    if (setSearchParams) {
      setSearchParams({ tab: tabId });
    }
  };

  const handleOpenVialSubmit = async (e) => {
    e.preventDefault();
    setVialSubmitting(true);
    setNotice(null);
    try {
      await api.post('/nurse/vials/open', {
        inventory_id: selectedBatchForVial,
        total_doses: Number(vialDoseCap) || 5,
      });
      setNotice(
        `Reconstituted multi-dose PVRV vial (${vialDoseCap} ID doses). Live 6-hour countdown timer started.`
      );
      setOpenVialModal(false);
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to reconstitute vial.');
    } finally {
      setVialSubmitting(false);
    }
  };

  const handleAdministerDose = async (dose, { useOpenVialId = null } = {}) => {
    setAdministeringId(dose.id);
    setNotice(null);
    try {
      await api.post('/nurse/doses/administer', {
        dose_id: dose.id,
        reconstituted_vial_id: useOpenVialId || null,
        inventory_id: useOpenVialId ? null : selectedFefoBatchId,
      });
      setNotice(
        `Administered Day ${dose.dose_day} PEP dose for ${
          dose.patient?.full_name || 'Patient'
        } • Stamped with Nurse PRC (${nursePrc}).`
      );
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to administer PEP dose.');
    } finally {
      setAdministeringId(null);
    }
  };

  const handleForwardToDoctor = async (c) => {
    setNotice(null);
    try {
      await api.patch(`/cases/${c.id}`, {
        status: 'pending_doctor',
        notes: c.notes,
      });
      setNotice(`Forwarded Case ${c.case_number} (${c.patient?.full_name}) to Physician Queue.`);
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to forward case.');
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setWalkInSubmitting(true);
    setNotice(null);
    try {
      await api.post('/patients', {
        ...walkInForm,
        create_case: true,
      });
      setNotice(`Registered walk-in patient ${walkInForm.full_name} into ${branchLabel}.`);
      setWalkInModalOpen(false);
      setWalkInForm({
        full_name: '',
        phone: '',
        address: '',
        age: 28,
        sex: 'male',
        animal_type: 'dog',
        wound_site: 'Right Hand',
        notes: 'Walk-in wound washed with soap and running water for 15 minutes.',
        forward_to_doctor: true,
      });
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to register walk-in patient.');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const handleColdChainSubmit = async (e) => {
    e.preventDefault();
    setColdSubmitting(true);
    setNotice(null);
    try {
      const res = await api.post('/nurse/cold-chain', {
        temperature_c: Number(coldForm.temperature_c),
        shift_label: coldForm.shift_label,
      });
      const logged = res?.data?.log;
      if (logged?.is_breach) {
        setNotice(
          `CRITICAL COLD-CHAIN BREACH LOGGED (${logged.temperature_c}°C — outside 2.0°C–8.0°C). Alert escalated to Owner Command Center.`
        );
      } else {
        setNotice(
          `Logged compliant refrigerator temperature (${logged?.temperature_c}°C) for ${coldForm.shift_label}.`
        );
      }
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to record cold-chain reading.');
    } finally {
      setColdSubmitting(false);
    }
  };

  const handleDefaulterCallSubmit = async (e) => {
    e.preventDefault();
    if (!callTargetDose) return;
    setCallSubmitting(true);
    setNotice(null);
    try {
      await api.post('/nurse/defaulters/call', {
        dose_id: callTargetDose.id,
        case_id: callTargetDose.case_id,
        outcome: callForm.outcome,
        notes: callForm.notes,
        reschedule_date: callForm.reschedule_date || undefined,
      });
      setNotice(
        `Logged phone follow-up outcome for ${
          callTargetDose.patient?.full_name || 'Patient'
        } (Day ${callTargetDose.dose_day}).`
      );
      setCallTargetDose(null);
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to log defaulter callback.');
    } finally {
      setCallSubmitting(false);
    }
  };

  if (loading && !data) {
    return <WorkspaceSkeleton isDark={isDark} />;
  }

  if (error && !data) {
    return (
      <div
        role="alert"
        className="rounded-3xl border-2 border-red-400 bg-red-50 p-6 text-red-900"
      >
        <h2 className="text-base font-extrabold">
          Unable to Load Nurse Clinical Workspace
        </h2>
        <p className="mt-1 text-xs">{error}</p>
        <button
          type="button"
          onClick={fetchWorkspace}
          className="mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Live Query</span>
        </button>
      </div>
    );
  }

  const activeVials = (data?.activeVials || []).map((v) => {
    const expMs = new Date(v.expires_at).getTime();
    const liveSeconds = Math.max(0, Math.floor((expMs - nowTick) / 1000));
    const remDoses = Math.max(
      0,
      Number(v.total_doses || 5) - Number(v.administered_doses || 0)
    );
    return {
      ...v,
      liveSeconds,
      remDoses,
      isUnderOneHour: liveSeconds > 0 && liveSeconds <= 3600,
    };
  });

  const walkInCases = data?.walkInCases || [];
  const scheduledBoosters = data?.scheduledBoosters || [];
  const dueOrScheduledBoosters = scheduledBoosters.filter(
    (d) => d.status === 'scheduled'
  );
  const fefoInventory = data?.fefoInventory || [];
  const vaccineFefoBatches = fefoInventory.filter((i) => i.category === 'vaccine');
  const defaulters = data?.defaulters || [];
  const coldChainLogs = data?.coldChainLogs || [];
  const latestCold = data?.latestColdChain || coldChainLogs[0] || null;

  return (
    <div className="space-y-6">
      {/* Strictly Branch-Locked Nurse Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#118AB2]/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#118AB2]">
            <Lock className="h-3.5 w-3.5" />
            <span>
              Nurse Portal • Strictly Locked to {branchLabel} • {nursePrc}
            </span>
          </div>
          <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
            6-Hour Open-Vial Optimizer, FEFO Dose Logger &amp; Cold-Chain Surveillance
          </h1>
          <p className="text-xs opacity-75">
            Minimize multi-dose PVRV wastage, enforce First-Expiry First-Out batch discipline, and track Category III booster defaulters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWalkInModalOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Walk-In Patient Triage</span>
          </button>

          <button
            type="button"
            onClick={fetchWorkspace}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Branch DB</span>
          </button>
        </div>
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
            className="rounded-lg p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nurse KPI Strip */}
      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4">
          <span className="text-[11px] font-extrabold uppercase opacity-75">
            Active 6-Hr Open Vials
          </span>
          <p className="mt-2 text-2xl font-extrabold text-[#118AB2]">
            {activeVials.length}
          </p>
          <p className="mt-1 text-[11px] font-bold text-emerald-600">
            {activeVials.reduce((acc, v) => acc + v.remDoses, 0)} sharable ID doses left
          </p>
        </div>

        <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4">
          <span className="text-[11px] font-extrabold uppercase opacity-75">
            Walk-In vs Booster Queue
          </span>
          <p className="mt-2 text-2xl font-extrabold">
            {walkInCases.length} Walk-Ins • {dueOrScheduledBoosters.length} Boosters
          </p>
          <p className="mt-1 text-[11px] opacity-75">
            Synced with Mobile AI Pre-Triage
          </p>
        </div>

        <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4">
          <span className="text-[11px] font-extrabold uppercase opacity-75">
            Priority Cat III Defaulters
          </span>
          <p className="mt-2 text-2xl font-extrabold text-red-600">
            {defaulters.length}
          </p>
          <p className="mt-1 text-[11px] opacity-75">
            Ranked by WHO Category III urgency
          </p>
        </div>

        <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4">
          <span className="text-[11px] font-extrabold uppercase opacity-75">
            Latest Shift Cold-Chain
          </span>
          <p
            className={`mt-2 text-2xl font-extrabold ${
              latestCold?.is_breach ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {latestCold ? `${latestCold.temperature_c}°C` : 'Not Logged'}
          </p>
          <p className="mt-1 text-[11px] opacity-75">
            WHO Range: 2.0°C – 8.0°C
          </p>
        </div>
      </section>

      {/* Module Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {NURSE_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchTab(id)}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              activeTab === id
                ? 'bg-[#118AB2] text-white shadow-sm'
                : 'border border-[#DDDCD4] bg-white hover:border-[#118AB2]'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: SMART 6-HOUR OPEN-VIAL COUNTDOWN & QUEUE OPTIMIZER */}
      {activeTab === 'vials' && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <div>
                <h2 className="text-lg font-extrabold">
                  Smart 6-Hour Open-Vial Countdown &amp; ID Queue Optimizer
                </h2>
                <p className="text-xs opacity-75">
                  Reconstituted multi-dose PVRV vials must be used within 6 hours. Waiting ID patients who can share remaining doses are highlighted below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenVialModal(true)}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#118AB2] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
              >
                <FlaskConical className="h-4 w-4" />
                <span>Reconstitute Multi-Dose PVRV Vial</span>
              </button>
            </div>

            {activeVials.length === 0 ? (
              <div className="rounded-2xl border border-[#DDDCD4] p-8 text-center text-xs font-bold opacity-75">
                No active open PVRV vials right now. Click &ldquo;Reconstitute Multi-Dose PVRV Vial&rdquo; when opening a new vial.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeVials.map((vial) => (
                  <div
                    key={vial.id}
                    className={`rounded-2xl border-2 p-4 ${
                      vial.isUnderOneHour
                        ? 'border-red-500 bg-red-50/40'
                        : 'border-[#118AB2] bg-[#F2F2ED]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          vial.isUnderOneHour
                            ? 'bg-red-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {vial.isUnderOneHour
                          ? 'EXPIRING < 1 HOUR — PRIORITIZE ID PATIENTS'
                          : 'ACTIVE 6-HOUR MULTI-DOSE VIAL'}
                      </span>
                      <span className="font-mono text-xs font-extrabold">
                        Lot {vial.lot_number}
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <div>
                        <p className="text-sm font-extrabold">{vial.vaccine_name}</p>
                        <p className="text-xs font-bold text-[#118AB2]">
                          {vial.remDoses} of {vial.total_doses} ID Doses Remaining (
                          {vial.administered_doses} administered)
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-bold uppercase opacity-70">
                          6-Hr Discard Timer
                        </span>
                        <span
                          data-testid="open-vial-countdown"
                          className={`font-mono text-2xl font-extrabold ${
                            vial.isUnderOneHour ? 'text-red-600' : 'text-[#118AB2]'
                          }`}
                        >
                          {formatCountdown(vial.liveSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Waiting Intradermal (ID) Patients Highlighted to Share Active Open Vial */}
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
            <h3 className="text-base font-extrabold">
              Waiting Intradermal (ID) Patients Eligible to Share Active Open Vial
            </h3>
            <p className="text-xs opacity-75">
              Patients highlighted in Mint Teal can immediately receive a dose from an active reconstituted vial to prevent 6-hour discard wastage.
            </p>

            <div className="mt-4 space-y-2.5 text-xs">
              {dueOrScheduledBoosters.length === 0 ? (
                <p className="py-6 text-center font-bold opacity-75">
                  No waiting scheduled ID doses in queue.
                </p>
              ) : (
                dueOrScheduledBoosters.map((d) => (
                  <div
                    key={d.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 p-3.5 ${
                      d.canShareActiveVial
                        ? 'border-[#7CD5C7] bg-[#7CD5C7]/15'
                        : 'border-[#DDDCD4] bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {d.canShareActiveVial && (
                          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                            VIAL-SHARE MATCH • ZERO WASTAGE
                          </span>
                        )}
                        <span className="font-mono font-extrabold text-[#118AB2]">
                          {d.case_number} • Day {d.dose_day}
                        </span>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                          Cat {d.exposure_category}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-extrabold">
                        {d.patient?.full_name || 'Patient'} ({d.wound_site})
                      </p>
                      <p className="text-[11px] opacity-75">
                        Scheduled: {d.scheduled_date} • {d.regimen_type}
                      </p>
                    </div>

                    {activeVials.length > 0 && activeVials[0].remDoses > 0 ? (
                      <button
                        type="button"
                        disabled={administeringId === d.id}
                        onClick={() =>
                          handleAdministerDose(d, {
                            useOpenVialId: activeVials[0].id,
                          })
                        }
                        className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <Syringe className="h-3.5 w-3.5" />
                        <span>
                          {administeringId === d.id
                            ? 'Administering...'
                            : `Administer From Open Vial (${activeVials[0].lot_number})`}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => switchTab('fefo')}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#118AB2] px-3.5 py-2 text-xs font-extrabold text-[#118AB2]"
                      >
                        <span>Open FEFO Logger &rarr;</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: BRANCH PATIENT TRIAGE & MOBILE INTAKE FEED */}
      {activeTab === 'triage' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Column 1: Walk-In New Cases with Mobile AI Pre-Triage Badge */}
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3">
              <div>
                <span className="rounded-full bg-[#118AB2]/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#118AB2]">
                  Intake Stream A
                </span>
                <h2 className="mt-1 text-base font-extrabold">
                  Walk-In New Cases &amp; Mobile AI Pre-Triage ({walkInCases.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setWalkInModalOpen(true)}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-xl bg-[#118AB2] px-3 py-1.5 text-xs font-extrabold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Walk-In</span>
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              {walkInCases.length === 0 ? (
                <p className="py-8 text-center font-bold opacity-75">
                  No new walk-in triage cases waiting right now.
                </p>
              ) : (
                walkInCases.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-[#DDDCD4] bg-[#F2F2ED]/50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-extrabold text-[#118AB2]">
                        {c.case_number}
                      </span>
                      {c.aiTriage ? (
                        <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                          Mobile AI Pre-Triage: Cat {c.aiTriage.ai_predicted_category} (
                          {c.aiTriage.confidence_score}%)
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#118AB2]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#118AB2]">
                          Cat {c.exposure_category || 'II'} Walk-In
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-sm font-extrabold">
                      {c.patient?.full_name || 'Patient'} ({c.patient?.age || '—'}y •{' '}
                      {c.patient?.phone || 'No Phone'})
                    </h3>
                    <p className="mt-0.5 font-semibold">
                      Exposure: {String(c.animal_type).toUpperCase()} bite/scratch on{' '}
                      {c.wound_site}
                    </p>
                    <p className="mt-1 text-[11px] opacity-80">{c.notes}</p>

                    <div className="mt-3 flex items-center justify-between border-t border-[#DDDCD4] pt-2.5">
                      <span className="text-[11px] font-extrabold uppercase text-[#118AB2]">
                        Status: {c.status}
                      </span>
                      {c.status === 'queued_nurse' && (
                        <button
                          type="button"
                          onClick={() => handleForwardToDoctor(c)}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#118AB2] px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-[#0D6E8E]"
                        >
                          <Send className="h-3 w-3" />
                          <span>Forward to Physician</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Column 2: Scheduled Booster Patients (Day 3, 7, 14, 28) */}
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
            <div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700">
                Intake Stream B
              </span>
              <h2 className="mt-1 text-base font-extrabold">
                Scheduled Booster Patients — Days 3, 7, 14 &amp; 28 (
                {dueOrScheduledBoosters.length})
              </h2>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {dueOrScheduledBoosters.length === 0 ? (
                <p className="py-8 text-center font-bold opacity-75">
                  No scheduled booster doses pending for this branch.
                </p>
              ) : (
                dueOrScheduledBoosters.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#DDDCD4] p-3.5"
                  >
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#118AB2]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#118AB2]">
                        <CalendarClock className="h-3 w-3" />
                        <span>Day {d.dose_day} Booster • {d.scheduled_date}</span>
                      </span>
                      <p className="mt-1 text-sm font-extrabold">
                        {d.patient?.full_name || 'Patient'} ({d.case_number})
                      </p>
                      <p className="text-[11px] opacity-75">
                        Cat {d.exposure_category} • {d.wound_site}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={administeringId === d.id}
                      onClick={() => handleAdministerDose(d)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
                    >
                      <Syringe className="h-3.5 w-3.5" />
                      <span>Administer FEFO</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: FEFO DOSE ADMINISTRATION LOGGER */}
      {activeTab === 'fefo' && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <div>
                <h2 className="text-lg font-extrabold">
                  First-Expiry, First-Out (FEFO) Batch Selector &amp; PRC Dose Logger
                </h2>
                <p className="text-xs opacity-75">
                  Batches are sorted strictly by earliest expiration date. Each administered dose deducts stock and stamps your verified Nurse PRC ID ({nursePrc}).
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#118AB2]/15 px-3 py-1.5 font-mono text-xs font-extrabold text-[#118AB2]">
                <Stamp className="h-4 w-4" />
                <span>Active Nurse Stamp: {nursePrc}</span>
              </span>
            </div>

            {/* FEFO Batch Selector Cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {vaccineFefoBatches.map((batch) => {
                const isSelected = selectedFefoBatchId === batch.id;
                return (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => setSelectedFefoBatchId(batch.id)}
                    className={`flex flex-col justify-between rounded-2xl border-2 p-4 text-left text-xs transition ${
                      isSelected
                        ? 'border-[#118AB2] bg-[#118AB2]/10'
                        : 'border-[#DDDCD4] bg-[#F2F2ED]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        {batch.isRecommendedFefo ? (
                          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                            FEFO PRIORITY #1
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            Reserve Lot
                          </span>
                        )}
                        <span className="font-mono font-extrabold text-[#118AB2]">
                          {batch.stock_vials} vials
                        </span>
                      </div>
                      <p className="mt-2 font-extrabold">{batch.item_name}</p>
                      <p className="font-mono text-[11px] opacity-80">
                        Lot: {batch.batch_number}
                      </p>
                    </div>
                    <p className="mt-2 border-t border-[#DDDCD4] pt-2 text-[11px] font-bold text-amber-700">
                      Expires: {batch.expiry_date} ({batch.daysUntilExpiry} days)
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Doses Table for FEFO Administration */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDDCD4] bg-[#F2F2ED] text-[11px] font-extrabold uppercase">
                    <th className="px-3.5 py-3">Patient &amp; Case</th>
                    <th className="px-3.5 py-3">PEP Milestone</th>
                    <th className="px-3.5 py-3">Scheduled Date</th>
                    <th className="px-3.5 py-3">Status / Lot &amp; PRC Stamp</th>
                    <th className="px-3.5 py-3 text-right">FEFO Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDDCD4]/70">
                  {scheduledBoosters.map((d) => (
                    <tr key={d.id}>
                      <td className="px-3.5 py-3">
                        <p className="font-extrabold">{d.patient?.full_name || 'Patient'}</p>
                        <p className="font-mono text-[11px] text-[#118AB2]">
                          {d.case_number} • Cat {d.exposure_category}
                        </p>
                      </td>
                      <td className="px-3.5 py-3 font-extrabold">Day {d.dose_day}</td>
                      <td className="px-3.5 py-3 font-mono">{d.scheduled_date}</td>
                      <td className="px-3.5 py-3">
                        {d.status === 'completed' ? (
                          <div>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-900">
                              COMPLETED
                            </span>
                            <p className="mt-1 font-mono text-[11px] opacity-80">
                              {d.vaccine_brand} • {d.lot_number}
                            </p>
                          </div>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-900">
                            {d.status}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        {d.status !== 'completed' && (
                          <button
                            type="button"
                            disabled={administeringId === d.id}
                            onClick={() =>
                              handleAdministerDose(d, {
                                useOpenVialId: selectedActiveVialId || null,
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-2 text-[11px] font-extrabold text-white hover:bg-[#0D6E8E]"
                          >
                            <Syringe className="h-3.5 w-3.5" />
                            <span>
                              {administeringId === d.id
                                ? 'Stamping...'
                                : `Administer & Stamp ${nursePrc}`}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: RISK-STRATIFIED DEFAULTER & COLD-CHAIN TRACKER */}
      {activeTab === 'defaulters' && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left 7 Cols: Risk-Stratified Defaulter Callback Tracker */}
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs lg:col-span-7">
            <h2 className="text-lg font-extrabold text-red-600">
              Risk-Stratified Defaulter Queue (Cat III Day 3/7/14 Priority)
            </h2>
            <p className="text-xs opacity-75">
              Missed follow-ups are automatically ranked with Category III Day 3, 7, and 14 defaulters at top priority.
            </p>

            {defaulters.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[#DDDCD4] p-8 text-center text-xs font-bold opacity-75">
                No missed follow-ups recorded at {branchLabel} today.
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-xs">
                {defaulters.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-2xl border-2 border-red-400/70 bg-red-50/40 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                        {d.priorityTier} • DAY {d.dose_day}
                      </span>
                      <span className="font-mono font-extrabold text-red-700">
                        Missed Date: {d.scheduled_date}
                      </span>
                    </div>

                    <h3 className="mt-2 text-base font-extrabold">
                      {d.patient?.full_name || 'Patient'} ({d.case_number})
                    </h3>
                    <p className="font-bold">
                      Phone: {d.patient?.phone || 'N/A'} • Site: {d.wound_site}
                    </p>

                    {d.callLogs?.length > 0 && (
                      <div className="mt-2.5 rounded-xl border border-[#DDDCD4] bg-white p-2.5 text-[11px]">
                        <p className="font-extrabold text-emerald-700">
                          Latest Callback: {d.callLogs[0].outcome}
                        </p>
                        <p className="opacity-80">{d.callLogs[0].notes}</p>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCallTargetDose(d);
                          setCallForm({
                            outcome: 'Reached — Confirmed Afternoon Arrival',
                            notes: '',
                            reschedule_date: new Date().toISOString().slice(0, 10),
                          });
                        }}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-red-700"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>Log Follow-Up Call</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right 5 Cols: Mandatory Shift Cold-Chain Temperature Logger (2.0°C - 8.0°C) */}
          <section className="space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-[#DDDCD4] bg-white p-5 shadow-xs">
              <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-[10px] font-extrabold uppercase text-[#118AB2]">
                WHO Cold-Chain Compliance (2.0°C – 8.0°C)
              </span>
              <h2 className="mt-1.5 text-base font-extrabold">
                Mandatory Shift Refrigerator Temperature Logger
              </h2>
              <p className="text-xs opacity-75">
                Readings outside 2.0°C–8.0°C immediately trigger a breach alert in the Owner Command Center.
              </p>

              <form onSubmit={handleColdChainSubmit} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-extrabold">
                    Vaccine Refrigerator Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={coldForm.temperature_c}
                    onChange={(e) =>
                      setColdForm({ ...coldForm, temperature_c: e.target.value })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3.5 py-2 text-base font-extrabold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold">Clinical Shift Label</label>
                  <select
                    value={coldForm.shift_label}
                    onChange={(e) =>
                      setColdForm({ ...coldForm, shift_label: e.target.value })
                    }
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                  >
                    <option value="Morning Shift (08:00 AM)">Morning Shift (08:00 AM)</option>
                    <option value="Midday Check (12:00 PM)">Midday Check (12:00 PM)</option>
                    <option value="Afternoon Shift Check (02:00 PM)">
                      Afternoon Shift Check (02:00 PM)
                    </option>
                    <option value="Evening Closing (06:00 PM)">
                      Evening Closing (06:00 PM)
                    </option>
                  </select>
                </div>

                {(Number(coldForm.temperature_c) < 2.0 ||
                  Number(coldForm.temperature_c) > 8.0) && (
                  <div className="rounded-xl border border-red-400 bg-red-50 p-3 text-red-900">
                    <p className="flex items-center gap-1.5 font-extrabold">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>OUT-OF-RANGE TEMPERATURE WARNING</span>
                    </p>
                    <p className="mt-0.5 text-[11px]">
                      Submitting {coldForm.temperature_c}°C will automatically log a Cold-Chain Breach and notify the Super Admin.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={coldSubmitting}
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                >
                  <ThermometerSnowflake className="h-4 w-4" />
                  <span>
                    {coldSubmitting
                      ? 'Recording Shift Temp...'
                      : 'Record Shift Temperature Reading'}
                  </span>
                </button>
              </form>

              {/* Recent Cold-Chain Readings */}
              <div className="mt-5 space-y-2 border-t border-[#DDDCD4] pt-4 text-xs">
                <h3 className="font-extrabold uppercase tracking-wider opacity-75">
                  Recent Branch Temperature Logs
                </h3>
                {coldChainLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-xl border border-[#DDDCD4] px-3 py-2"
                  >
                    <div>
                      <p className="font-bold">{log.shift_label}</p>
                      <p className="text-[10px] opacity-70">
                        {new Date(log.recorded_at).toLocaleString('en-PH')}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-extrabold ${
                        log.is_breach
                          ? 'bg-red-600 text-white'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {log.temperature_c}°C
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* RECONSTITUTE MULTI-DOSE VIAL MODAL */}
      {openVialModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reconstitute Multi-Dose PVRV Vial"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DDDCD4] pb-3">
              <h2 className="text-base font-extrabold">
                Reconstitute Multi-Dose PVRV Vial (6-Hr Timer)
              </h2>
              <button
                type="button"
                onClick={() => setOpenVialModal(false)}
                className="rounded-xl border border-[#DDDCD4] p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleOpenVialSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold">
                  Select FEFO Vaccine Batch (Sorted Earliest Expiry First)
                </label>
                <select
                  value={selectedBatchForVial}
                  onChange={(e) => setSelectedBatchForVial(e.target.value)}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                >
                  {vaccineFefoBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.isRecommendedFefo ? '[FEFO #1] ' : ''}
                      {b.item_name} — Lot {b.batch_number} (Exp: {b.expiry_date} •{' '}
                      {b.stock_vials} vials)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-extrabold">
                  Intradermal (ID) Doses Capacity per Vial
                </label>
                <select
                  value={vialDoseCap}
                  onChange={(e) => setVialDoseCap(Number(e.target.value))}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                >
                  <option value={5}>5 Intradermal (ID) Doses (0.5mL Vial)</option>
                  <option value={8}>8 Intradermal (ID) Doses (1.0mL Vial)</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenVialModal(false)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 font-extrabold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={vialSubmitting}
                  className="min-h-[42px] rounded-xl bg-[#118AB2] px-5 py-2 font-extrabold text-white hover:bg-[#0D6E8E]"
                >
                  {vialSubmitting ? 'Starting 6-Hr Timer...' : 'Open Vial & Start 6-Hr Timer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WALK-IN PATIENT TRIAGE REGISTRATION MODAL */}
      {walkInModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Register Walk-In Bite Patient"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DDDCD4] pb-3">
              <h2 className="text-base font-extrabold">
                Walk-In Patient Registration &amp; Triage ({branchLabel})
              </h2>
              <button
                type="button"
                onClick={() => setWalkInModalOpen(false)}
                className="rounded-xl border border-[#DDDCD4] p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleWalkInSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-extrabold">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={walkInForm.full_name}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, full_name: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={walkInForm.phone}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, phone: e.target.value })
                    }
                    placeholder="09171234567"
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-extrabold">Age</label>
                  <input
                    type="number"
                    value={walkInForm.age}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, age: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold">Sex</label>
                  <select
                    value={walkInForm.sex}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, sex: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-extrabold">Biting Animal</label>
                  <select
                    value={walkInForm.animal_type}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, animal_type: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="other">Other Mammal</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-extrabold">Anatomical Wound Site</label>
                  <input
                    type="text"
                    required
                    value={walkInForm.wound_site}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, wound_site: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold">Address / Barangay</label>
                  <input
                    type="text"
                    required
                    value={walkInForm.address}
                    onChange={(e) =>
                      setWalkInForm({ ...walkInForm, address: e.target.value })
                    }
                    className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold">Nurse Triage &amp; Wound Washing Notes</label>
                <textarea
                  rows={2}
                  value={walkInForm.notes}
                  onChange={(e) =>
                    setWalkInForm({ ...walkInForm, notes: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#DDDCD4] p-3 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(false)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 font-extrabold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkInSubmitting}
                  className="min-h-[42px] rounded-xl bg-emerald-600 px-5 py-2 font-extrabold text-white hover:bg-emerald-700"
                >
                  {walkInSubmitting ? 'Encrypting & Saving...' : 'Register & Forward to Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEFAULTER PHONE FOLLOW-UP MODAL */}
      {callTargetDose && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log Defaulter Follow-Up Call"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DDDCD4] pb-3">
              <h2 className="text-base font-extrabold">
                Log Defaulter Callback ({callTargetDose.patient?.full_name})
              </h2>
              <button
                type="button"
                onClick={() => setCallTargetDose(null)}
                className="rounded-xl border border-[#DDDCD4] p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleDefaulterCallSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold">Call Outcome</label>
                <select
                  value={callForm.outcome}
                  onChange={(e) =>
                    setCallForm({ ...callForm, outcome: e.target.value })
                  }
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                >
                  <option value="Reached — Confirmed Afternoon Arrival">
                    Reached — Confirmed Afternoon Arrival
                  </option>
                  <option value="Reached — Rescheduled for Tomorrow">
                    Reached — Rescheduled for Tomorrow
                  </option>
                  <option value="Unreachable — Sent SMS Reminder & Emergency Contact Alert">
                    Unreachable — Sent SMS Reminder &amp; Emergency Contact Alert
                  </option>
                  <option value="Completed Booster at Sister Victorio ABC Branch">
                    Completed Booster at Sister Victorio ABC Branch
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-extrabold">Reschedule Booster Date (Optional)</label>
                <input
                  type="date"
                  value={callForm.reschedule_date}
                  onChange={(e) =>
                    setCallForm({ ...callForm, reschedule_date: e.target.value })
                  }
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                />
              </div>
              <div>
                <label className="block font-extrabold">Call Notes</label>
                <textarea
                  rows={2}
                  required
                  value={callForm.notes}
                  onChange={(e) =>
                    setCallForm({ ...callForm, notes: e.target.value })
                  }
                  placeholder="Document conversation details and patient commitment..."
                  className="mt-1 w-full rounded-xl border border-[#DDDCD4] p-3 font-semibold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCallTargetDose(null)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 font-extrabold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={callSubmitting}
                  className="min-h-[42px] rounded-xl bg-red-600 px-5 py-2 font-extrabold text-white hover:bg-red-700"
                >
                  {callSubmitting ? 'Saving Call Log...' : 'Save Follow-Up Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default NurseDashboardPage;

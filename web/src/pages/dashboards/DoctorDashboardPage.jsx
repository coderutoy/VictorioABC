import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Calculator,
  AlertTriangle,
  Stamp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Lock,
  X,
  Plus,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { getBranchBySlug, formatBranchLabel } from '../../config/branches';
import { WorkspaceSkeleton } from '../../components/ui/BufferLoader';

export function DoctorDashboardPage() {
  const { profile } = useAuth();
  const outletCtx = useOutletContext() || {};
  const isDark = Boolean(outletCtx.isDark);
  const rawTab = outletCtx.activeTab || 'ai_queue';
  const activeTab = rawTab === 'signoff' ? 'dosing' : rawTab;
  const setSearchParams = outletCtx.setSearchParams;

  const assignedBranch = getBranchBySlug(profile?.branch_id || 'santa-maria');
  const branchLabel = formatBranchLabel(assignedBranch);
  const doctorPrc = profile?.prc_license_number || 'PRC-0148291';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // AI Override Modal State
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [overrideCat, setOverrideCat] = useState('II');
  const [overrideReason, setOverrideReason] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);

  // Weight-Based Dosing Engine State
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [dosingForm, setDosingForm] = useState({
    exposure_category: 'III',
    patient_weight_kg: 62,
    prior_pep_within_3_months: false,
    allergies: 'None reported',
    is_pregnant: false,
    anatomical_site: 'Right Hand & Thenar Web',
    is_high_risk_cat3: true,
    erig_hrig_type: 'ERIG (Equirab 200 IU/mL)',
    tetanus_given: true,
    philhealth_abtp_validated: true,
    notes: '',
  });
  const [dosingSubmitting, setDosingSubmitting] = useState(false);

  // AEFI Reporting Modal State
  const [aefiModalOpen, setAefiModalOpen] = useState(false);
  const [aefiSubmitting, setAefiSubmitting] = useState(false);
  const [aefiForm, setAefiForm] = useState({
    case_id: '',
    severity: 'mild',
    symptoms: '',
    action_taken: '',
  });

  const populateDosingFromCase = useCallback((c) => {
    if (!c) return;
    setDosingForm({
      exposure_category: c.exposure_category || 'III',
      patient_weight_kg: Number(c.patient_weight_kg) || 60,
      prior_pep_within_3_months: Boolean(c.prior_pep_within_3_months),
      allergies: c.allergies || 'None reported',
      is_pregnant: Boolean(c.is_pregnant),
      anatomical_site: c.anatomical_site || c.wound_site || 'Right Hand',
      is_high_risk_cat3: Boolean(
        c.is_high_risk_cat3 || c.exposure_category === 'III'
      ),
      erig_hrig_type:
        c.erig_hrig_type && c.erig_hrig_type.includes('HRIG')
          ? 'HRIG (Berirab 150 IU/mL)'
          : 'ERIG (Equirab 200 IU/mL)',
      tetanus_given: Boolean(c.tetanus_given),
      philhealth_abtp_validated: c.philhealth_abtp_validated !== false,
      notes: c.notes || '',
    });
  }, []);

  const fetchWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/doctor/workspace');
      const payload = res?.data?.data || null;
      setData(payload);

      if (payload?.cases?.length > 0 && !selectedCaseId) {
        const firstCase =
          payload.cases.find((c) => c.status === 'pending_doctor') ||
          payload.cases[0];
        if (firstCase) {
          setSelectedCaseId(firstCase.id);
          populateDosingFromCase(firstCase);
        }
      }
    } catch (err) {
      setError(
        err?.userMessage ||
          err?.message ||
          'Failed to load branch-locked Doctor Workspace from live Supabase.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId, populateDosingFromCase]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const switchTab = (tabId) => {
    if (setSearchParams) {
      setSearchParams({ tab: tabId });
    }
  };

  const computedDosing = useMemo(() => {
    const weight = Math.max(1, Number(dosingForm.patient_weight_kg) || 60);
    const cat = dosingForm.exposure_category;
    const priorPep = Boolean(dosingForm.prior_pep_within_3_months);
    const isHrig = dosingForm.erig_hrig_type.includes('HRIG');
    const hasEquineAllergy =
      /equine|serum|horse|erig/i.test(dosingForm.allergies || '') &&
      !/none/i.test(dosingForm.allergies || '');

    let rigIu = 0;
    let rigMl = 0;
    let rigSummary = 'Not Indicated (Category I/II)';

    if (priorPep) {
      rigSummary = 'CONTRAINDICATED — Prior PEP Completed Within 3 Months Guardrail';
    } else if (cat === 'III') {
      rigIu = Math.round(weight * (isHrig ? 20 : 40));
      rigMl = Number((rigIu / (isHrig ? 150 : 200)).toFixed(2));
      rigSummary = isHrig
        ? `HRIG 20 IU/kg = ${rigIu.toLocaleString()} IU (${rigMl} mL @ 150 IU/mL)`
        : `ERIG 40 IU/kg = ${rigIu.toLocaleString()} IU (${rigMl} mL @ 200 IU/mL)`;
    }

    const regimenLabel = priorPep
      ? '2-Dose Booster Regimen (Day 0 & Day 3 Only — Prevents Over-Vaccination)'
      : cat === 'I'
        ? 'Category I Wound Washing & Observation Only (No Vaccine Required)'
        : 'Updated Thai Red Cross ID Regimen (5-Dose: Days 0, 3, 7, 14, 28)';

    return {
      weight,
      rigIu,
      rigMl,
      rigSummary,
      regimenLabel,
      hasEquineAllergy,
      priorPep,
    };
  }, [dosingForm]);

  const handleConfirmAi = async (sub) => {
    setVerifyingId(sub.id);
    setNotice(null);
    try {
      await api.post('/doctor/ai-verify', {
        submission_id: sub.id,
        verification_status: 'confirmed',
        doctor_final_category: sub.ai_predicted_category,
      });
      setNotice(
        `Confirmed Mobile AI Category ${sub.ai_predicted_category} prediction for ${
          sub.patient?.full_name || 'Patient'
        }. Concordance metrics updated in Supabase.`
      );
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to confirm AI triage.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideTarget) return;
    setVerifyingId(overrideTarget.id);
    setNotice(null);
    try {
      await api.post('/doctor/ai-verify', {
        submission_id: overrideTarget.id,
        verification_status: 'overridden',
        doctor_final_category: overrideCat,
        override_reason: overrideReason,
      });
      setNotice(
        `Overrode AI Category ${overrideTarget.ai_predicted_category} -> Category ${overrideCat} with logged justification.`
      );
      setOverrideTarget(null);
      setOverrideReason('');
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to override AI submission.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDosingSignoffSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    setDosingSubmitting(true);
    setNotice(null);
    try {
      await api.post('/doctor/dosing-signoff', {
        case_id: selectedCaseId,
        ...dosingForm,
      });
      setNotice(
        `Electronic PRC Sign-Off (${doctorPrc}) & Weight-Based Regimen saved to Supabase.`
      );
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to save dosing sign-off.');
    } finally {
      setDosingSubmitting(false);
    }
  };

  const handleQuickPrcSignoff = async (c) => {
    setDosingSubmitting(true);
    setNotice(null);
    try {
      await api.post('/doctor/dosing-signoff', {
        case_id: c.id,
        exposure_category: c.exposure_category || 'III',
        patient_weight_kg: c.patient_weight_kg || 60,
        prior_pep_within_3_months: Boolean(c.prior_pep_within_3_months),
        allergies: c.allergies || 'None reported',
        is_pregnant: Boolean(c.is_pregnant),
        anatomical_site: c.anatomical_site || c.wound_site || 'Right Hand',
        is_high_risk_cat3: Boolean(c.is_high_risk_cat3 || c.exposure_category === 'III'),
        erig_hrig_type: c.erig_hrig_type || 'ERIG (Equirab 200 IU/mL)',
        tetanus_given: true,
        philhealth_abtp_validated: true,
        notes: c.notes,
      });
      setNotice(
        `Stamped Case ${c.case_number} with Physician PRC (${doctorPrc}) & validated PhilHealth ABTP claim.`
      );
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to stamp PRC sign-off.');
    } finally {
      setDosingSubmitting(false);
    }
  };

  const handleAefiSubmit = async (e) => {
    e.preventDefault();
    setAefiSubmitting(true);
    setNotice(null);
    try {
      await api.post('/doctor/aefi', aefiForm);
      setNotice('Logged Adverse Event Following Immunization (AEFI) report to Supabase.');
      setAefiModalOpen(false);
      setAefiForm({ case_id: '', severity: 'mild', symptoms: '', action_taken: '' });
      await fetchWorkspace();
    } catch (err) {
      setError(err?.userMessage || err?.message || 'Failed to save AEFI report.');
    } finally {
      setAefiSubmitting(false);
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
          Unable to Load Doctor Clinical Workspace
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

  const aiQueue = data?.aiQueue || [];
  const aiMetrics = data?.aiMetrics || {};
  const cases = data?.cases || [];
  const highRiskCat3Cases = data?.highRiskCat3Cases || [];
  const aefiReports = data?.aefiReports || [];

  return (
    <div className="space-y-6">
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
            className="rounded-lg p-1"
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
            onClick={fetchWorkspace}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================================
          VIEW 1: AI TRIAGE QUEUE (`activeTab === 'ai_queue'`)
         ===================================================================== */}
      {activeTab === 'ai_queue' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                <Lock className="h-3.5 w-3.5" />
                <span>Doctor Portal • {branchLabel} • {doctorPrc}</span>
              </div>
              <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
                Human-in-the-Loop Mobile AI Wound Verification Queue
              </h1>
              <p className="text-xs opacity-75">
                Confirm or override mobile-uploaded wound Category I/II/III predictions to update live clinical concordance metrics.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchWorkspace}
              disabled={loading}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#118AB2] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh AI Queue</span>
            </button>
          </div>

          {/* 3-Card AI Concordance Strip */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4">
              <span className="text-[11px] font-extrabold uppercase opacity-75">
                Pending Mobile AI Uploads
              </span>
              <p className="mt-1.5 text-2xl font-extrabold text-[#118AB2]">
                {aiMetrics.pendingCount ?? 0}
              </p>
              <p className="mt-1 text-[11px] opacity-75">
                {aiMetrics.totalSubmissions ?? 0} total submissions synced
              </p>
            </div>

            <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4">
              <span className="text-[11px] font-extrabold uppercase opacity-75">
                AI-Physician Concordance Rate
              </span>
              <p className="mt-1.5 text-2xl font-extrabold text-emerald-600">
                {aiMetrics.concordanceRatePct ?? 100}%
              </p>
              <p className="mt-1 text-[11px] opacity-75">
                {aiMetrics.confirmedCount ?? 0} confirmed • {aiMetrics.overriddenCount ?? 0} overridden
              </p>
            </div>

            <div className="rounded-2xl border border-[#DDDCD4] bg-white p-4">
              <span className="text-[11px] font-extrabold uppercase opacity-75">
                Verified PRC Stamp
              </span>
              <p className="mt-1.5 font-mono text-xl font-extrabold text-[#118AB2]">
                {doctorPrc}
              </p>
              <p className="mt-1 text-[11px] opacity-75">
                All verifications logged to immutable audit feed
              </p>
            </div>
          </div>

          {/* AI Submissions Grid */}
          {aiQueue.length === 0 ? (
            <div className="rounded-3xl border border-[#DDDCD4] bg-white p-8 text-center text-xs font-bold opacity-75">
              No mobile AI wound triage submissions recorded for {branchLabel} yet.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {aiQueue.map((sub) => {
                const isPending = sub.verification_status === 'pending';
                return (
                  <div
                    key={sub.id}
                    className={`flex flex-col justify-between rounded-3xl border-2 p-5 shadow-xs ${
                      isPending
                        ? 'border-[#118AB2] bg-white'
                        : 'border-[#DDDCD4] bg-white/80'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-extrabold text-[#118AB2]">
                            {sub.clinical_case?.case_number || 'Walk-In Intake'}
                          </span>
                          <h2 className="text-base font-extrabold">
                            {sub.patient?.full_name || 'Branch Patient'} (
                            {sub.patient?.age || '—'}y • {sub.patient?.sex || '—'})
                          </h2>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                            sub.ai_predicted_category === 'III'
                              ? 'bg-red-600 text-white'
                              : sub.ai_predicted_category === 'II'
                                ? 'bg-amber-500 text-white'
                                : 'bg-sky-600 text-white'
                          }`}
                        >
                          AI Cat {sub.ai_predicted_category} • {sub.confidence_score}%
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-[#DDDCD4] bg-slate-900">
                        <img
                          src={sub.wound_image_url}
                          alt={`Wound preview for ${sub.patient?.full_name || 'patient'}`}
                          className="h-44 w-full object-cover"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(sub.anatomical_risk_flags || []).map((flag) => (
                          <span
                            key={flag}
                            className="rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-extrabold text-red-900"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>

                      {sub.verification_status !== 'pending' && (
                        <div className="rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] p-3 text-xs">
                          <p className="font-extrabold">
                            Physician Decision:{' '}
                            <span className="uppercase text-[#118AB2]">
                              {sub.verification_status} (Final Category{' '}
                              {sub.doctor_final_category})
                            </span>
                          </p>
                          {sub.override_reason && (
                            <p className="mt-1 text-[11px] opacity-80">
                              Reason: {sub.override_reason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#DDDCD4] pt-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={verifyingId === sub.id}
                          onClick={() => handleConfirmAi(sub)}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            {verifyingId === sub.id
                              ? 'Saving...'
                              : `Confirm Cat ${sub.ai_predicted_category}`}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOverrideTarget(sub);
                            setOverrideCat(
                              sub.ai_predicted_category === 'III' ? 'II' : 'III'
                            );
                            setOverrideReason('');
                          }}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-500 bg-amber-50 px-3.5 py-2 text-xs font-extrabold text-amber-950 hover:bg-amber-100"
                        >
                          <XCircle className="h-4 w-4 text-amber-600" />
                          <span>Override</span>
                        </button>
                      </div>

                      {sub.clinical_case && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCaseId(sub.clinical_case.id);
                            populateDosingFromCase(sub.clinical_case);
                            switchTab('dosing');
                          }}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#118AB2]/15 px-3 py-2 text-xs font-extrabold text-[#118AB2] hover:bg-[#118AB2] hover:text-white"
                        >
                          <Calculator className="h-3.5 w-3.5" />
                          <span>Dosing &amp; Sign-Off &rarr;</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 2: PATIENT DOSING & SIGN-OFF (`activeTab === 'dosing'`)
         ===================================================================== */}
      {activeTab === 'dosing' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-[11px] font-extrabold uppercase text-[#118AB2]">
              Clinical Guardrails &amp; Electronic PRC Sign-Off
            </span>
            <h1 className="mt-1.5 text-xl font-extrabold sm:text-2xl">
              Weight-Based ERIG/HRIG Dosing Engine &amp; PhilHealth ABTP Registry
            </h1>
            <p className="text-xs opacity-75">
              Computes exact ERIG (40 IU/kg) &amp; HRIG (20 IU/kg) volumes, enforces the 2-dose booster guardrail for prior PEP &lt; 3 months, and stamps your PRC license ({doctorPrc}).
            </p>
          </div>

          <section className="grid gap-6 lg:grid-cols-12">
            {/* Left: Weight & Guardrails Calculator Form */}
            <div className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs lg:col-span-7">
              <form onSubmit={handleDosingSignoffSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-extrabold">Select Branch Patient Case</label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedCaseId(id);
                      const found = cases.find((c) => c.id === id);
                      if (found) populateDosingFromCase(found);
                    }}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED] px-3.5 py-2 font-extrabold"
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.case_number} — {c.patient?.full_name || 'Patient'} (Cat{' '}
                        {c.exposure_category || 'II'} • {c.wound_site})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block font-extrabold">Patient Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="2"
                      max="250"
                      required
                      value={dosingForm.patient_weight_kg}
                      onChange={(e) =>
                        setDosingForm({
                          ...dosingForm,
                          patient_weight_kg: e.target.value,
                        })
                      }
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 text-sm font-extrabold"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold">WHO Exposure Category</label>
                    <select
                      value={dosingForm.exposure_category}
                      onChange={(e) =>
                        setDosingForm({
                          ...dosingForm,
                          exposure_category: e.target.value,
                          is_high_risk_cat3: e.target.value === 'III',
                        })
                      }
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                    >
                      <option value="I">Category I (No Breach)</option>
                      <option value="II">Category II (Minor Scratch)</option>
                      <option value="III">Category III (Transdermal / Mucosal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-extrabold">RIG Biologic Type</label>
                    <select
                      value={dosingForm.erig_hrig_type}
                      onChange={(e) =>
                        setDosingForm({
                          ...dosingForm,
                          erig_hrig_type: e.target.value,
                        })
                      }
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                    >
                      <option value="ERIG (Equirab 200 IU/mL)">
                        ERIG (40 IU/kg • 200 IU/mL)
                      </option>
                      <option value="HRIG (Berirab 150 IU/mL)">
                        HRIG (20 IU/kg • 150 IU/mL)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-extrabold">Anatomical Wound Site</label>
                    <input
                      type="text"
                      value={dosingForm.anatomical_site}
                      onChange={(e) =>
                        setDosingForm({ ...dosingForm, anatomical_site: e.target.value })
                      }
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold">Known Drug / Serum Allergies</label>
                    <input
                      type="text"
                      value={dosingForm.allergies}
                      onChange={(e) =>
                        setDosingForm({ ...dosingForm, allergies: e.target.value })
                      }
                      placeholder="None reported (or Equine Serum)"
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-[#118AB2]/40 bg-[#118AB2]/5 p-3 font-extrabold">
                    <input
                      type="checkbox"
                      checked={dosingForm.prior_pep_within_3_months}
                      onChange={(e) =>
                        setDosingForm({
                          ...dosingForm,
                          prior_pep_within_3_months: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-[#118AB2]"
                    />
                    <span>Prior PEP Completed Within 3 Months (Auto 2-Dose Booster)</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 p-3 font-extrabold">
                    <input
                      type="checkbox"
                      checked={dosingForm.is_pregnant}
                      onChange={(e) =>
                        setDosingForm({
                          ...dosingForm,
                          is_pregnant: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-[#118AB2]"
                    />
                    <span>Patient is Pregnant (WHO Safe-PEP Guardrail)</span>
                  </label>
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 font-extrabold">
                  <input
                    type="checkbox"
                    checked={dosingForm.philhealth_abtp_validated}
                    onChange={(e) =>
                      setDosingForm({
                        ...dosingForm,
                        philhealth_abtp_validated: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span>
                    Validate for PhilHealth ABTP Claim &amp; Stamp Physician PRC ({doctorPrc})
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={dosingSubmitting}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#118AB2] px-5 py-3 text-xs font-extrabold text-white shadow-md hover:bg-[#0D6E8E] disabled:opacity-60"
                >
                  <Stamp className="h-4 w-4" />
                  <span>
                    {dosingSubmitting
                      ? 'Saving Dosing & Stamping PRC...'
                      : `Sign Off Dosing & Stamp PRC (${doctorPrc})`}
                  </span>
                </button>
              </form>
            </div>

            {/* Right: Real-Time Computed Dosage & Guardrails */}
            <div className="space-y-4 lg:col-span-5">
              <div className="rounded-3xl border-2 border-[#118AB2] bg-white p-6 shadow-xs">
                <span className="rounded-full bg-[#118AB2]/15 px-3 py-1 text-[10px] font-extrabold uppercase text-[#118AB2]">
                  Live Computed Output
                </span>
                <h2 className="mt-2 text-base font-extrabold">
                  Calculated RIG Volume &amp; WHO Regimen
                </h2>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="rounded-2xl bg-[#F2F2ED] p-4">
                    <span className="text-[10px] font-extrabold uppercase opacity-75">
                      Calculated RIG Dose &amp; Volume
                    </span>
                    <p className="mt-1 text-xl font-extrabold text-[#118AB2]">
                      {computedDosing.rigIu > 0
                        ? `${computedDosing.rigIu.toLocaleString()} IU (${computedDosing.rigMl} mL)`
                        : '0 IU (0.00 mL)'}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold opacity-80">
                      {computedDosing.rigSummary}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#F2F2ED] p-4">
                    <span className="text-[10px] font-extrabold uppercase opacity-75">
                      Auto-Selected WHO / DOH Schedule
                    </span>
                    <p className="mt-1 text-sm font-extrabold text-emerald-600">
                      {computedDosing.regimenLabel}
                    </p>
                  </div>

                  {computedDosing.priorPep && (
                    <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-3.5 text-amber-950">
                      <p className="flex items-center gap-1.5 font-extrabold">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>OVER-VACCINATION GUARDRAIL ACTIVE</span>
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed">
                        Switched automatically to a <strong>2-dose booster schedule (Day 0 &amp; Day 3)</strong> and suppressed RIG infiltration.
                      </p>
                    </div>
                  )}

                  {computedDosing.hasEquineAllergy && (
                    <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-3.5 text-red-950">
                      <p className="flex items-center gap-1.5 font-extrabold">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                        <span>EQUINE SERUM ALLERGY GUARDRAIL</span>
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed">
                        Switch biologic selection to <strong>HRIG (20 IU/kg @ 150 IU/mL)</strong> or perform mandatory skin test.
                      </p>
                    </div>
                  )}

                  {dosingForm.is_pregnant && (
                    <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-3.5 text-emerald-950">
                      <p className="flex items-center gap-1.5 font-extrabold">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>PREGNANCY CLINICAL GUARDRAIL</span>
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed">
                        Pregnancy is never a contraindication to Rabies PEP or RIG infiltration.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Branch PRC Sign-Off & PhilHealth ABTP Registry Table */}
          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold">
              Branch Animal Bite Registry &amp; Electronic PRC Sign-Off Ledger
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[840px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DDDCD4] bg-[#F2F2ED] text-[11px] font-extrabold uppercase">
                    <th className="px-3.5 py-3">Case &amp; Patient</th>
                    <th className="px-3.5 py-3">WHO Cat &amp; Site</th>
                    <th className="px-3.5 py-3">Regimen &amp; RIG</th>
                    <th className="px-3.5 py-3">PhilHealth ABTP</th>
                    <th className="px-3.5 py-3">PRC Stamp</th>
                    <th className="px-3.5 py-3 text-right">Sign-Off Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDDCD4]/70">
                  {cases.map((c) => (
                    <tr key={c.id}>
                      <td className="px-3.5 py-3">
                        <p className="font-extrabold">{c.patient?.full_name || 'Patient'}</p>
                        <p className="font-mono text-[11px] text-[#118AB2]">
                          {c.case_number}
                        </p>
                      </td>
                      <td className="px-3.5 py-3 font-bold">
                        Cat {c.exposure_category || 'II'} •{' '}
                        {c.anatomical_site || c.wound_site}
                      </td>
                      <td className="px-3.5 py-3">
                        <p className="font-bold">{c.regimen_type}</p>
                        {c.erig_hrig_iu > 0 && (
                          <p className="text-[11px] text-[#118AB2]">
                            {c.erig_hrig_type}: {c.erig_hrig_iu} IU ({c.erig_hrig_ml} mL)
                          </p>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            c.philhealth_abtp_validated
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {c.philhealth_abtp_validated ? 'ABTP Validated' : 'Pending ABTP'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-mono font-extrabold text-emerald-600">
                        {c.doctor_prc_signoff_license || 'Unsigned'}
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <button
                          type="button"
                          disabled={dosingSubmitting}
                          onClick={() => handleQuickPrcSignoff(c)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#118AB2] px-3.5 py-2 text-[11px] font-extrabold text-white hover:bg-[#0D6E8E]"
                        >
                          <Stamp className="h-3.5 w-3.5" />
                          <span>
                            {c.doctor_prc_signoff_license
                              ? 'Re-Stamp PRC'
                              : 'Stamp PRC & ABTP'}
                          </span>
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
          VIEW 3: HIGH-RISK & AEFI (`activeTab === 'cat3'`)
         ===================================================================== */}
      {activeTab === 'cat3' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <div>
              <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-extrabold uppercase text-red-800">
                High-Risk Exposure &amp; Pharmacovigilance
              </span>
              <h1 className="mt-1.5 text-xl font-extrabold text-red-600 sm:text-2xl">
                Category III Cranial/Hand Exposures &amp; AEFI Monitor
              </h1>
              <p className="text-xs opacity-75">
                Track severe Category III bites and log Adverse Events Following Immunization (AEFI) directly to Supabase.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAefiForm({
                  case_id: highRiskCat3Cases[0]?.id || cases[0]?.id || '',
                  severity: 'mild',
                  symptoms: '',
                  action_taken: '',
                });
                setAefiModalOpen(true);
              }}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              <span>Log AEFI Adverse Event</span>
            </button>
          </div>

          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold">
              Active High-Risk Category III Cases ({highRiskCat3Cases.length})
            </h2>
            {highRiskCat3Cases.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[#DDDCD4] p-6 text-center text-xs font-bold opacity-75">
                No active Category III cases recorded for {branchLabel}.
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {highRiskCat3Cases.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-2xl border-2 border-red-400/60 bg-red-50/30 p-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                          HIGH-RISK CAT III • {c.case_number}
                        </span>
                        <span className="font-mono text-[11px] font-bold">
                          {c.doctor_prc_signoff_license || 'Awaiting PRC Stamp'}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-extrabold">
                        {c.patient?.full_name || 'Patient'} ({c.patient?.age || '—'}y)
                      </h3>
                      <p className="mt-1 font-bold text-red-700">
                        Anatomical Site: {c.anatomical_site || c.wound_site}
                      </p>
                      <p className="mt-1 opacity-85">
                        RIG Dosing: {c.erig_hrig_type} •{' '}
                        {c.erig_hrig_iu
                          ? `${c.erig_hrig_iu} IU (${c.erig_hrig_ml} mL)`
                          : 'Pending calculation'}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-red-200 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCaseId(c.id);
                          populateDosingFromCase(c);
                          switchTab('dosing');
                        }}
                        className="rounded-xl bg-[#118AB2] px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-[#0D6E8E]"
                      >
                        Open Dosing &amp; PRC Sign-Off
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAefiForm({
                            case_id: c.id,
                            severity: 'mild',
                            symptoms: '',
                            action_taken: '',
                          });
                          setAefiModalOpen(true);
                        }}
                        className="rounded-xl border border-red-600 px-3 py-1.5 text-[11px] font-extrabold text-red-700 hover:bg-red-600 hover:text-white"
                      >
                        Report AEFI
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-xs">
            <h2 className="text-base font-extrabold">
              Branch AEFI (Adverse Event Following Immunization) Registry
            </h2>
            {aefiReports.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[#DDDCD4] p-6 text-center text-xs font-bold opacity-75">
                Zero AEFI adverse events reported at {branchLabel}.
              </div>
            ) : (
              <div className="mt-4 space-y-2.5 text-xs">
                {aefiReports.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-[#DDDCD4] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold">
                        {r.case_number} • {r.patient?.full_name || 'Patient'}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-900">
                        {r.severity} AEFI
                      </span>
                    </div>
                    <p className="mt-1.5 font-semibold">Symptoms: {r.symptoms}</p>
                    <p className="mt-0.5 font-bold text-emerald-700">
                      Clinical Action: {r.action_taken}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* AI OVERRIDE MODAL */}
      {overrideTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Override Mobile AI Classification"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DDDCD4] pb-3">
              <h2 className="text-base font-extrabold">
                Override Mobile AI Category ({overrideTarget.patient?.full_name})
              </h2>
              <button
                type="button"
                onClick={() => setOverrideTarget(null)}
                className="rounded-xl border border-[#DDDCD4] p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleOverrideSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold">
                  Physician Final WHO Category (AI Predicted: Cat{' '}
                  {overrideTarget.ai_predicted_category})
                </label>
                <select
                  value={overrideCat}
                  onChange={(e) => setOverrideCat(e.target.value)}
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                >
                  <option value="I">Category I (Intact Skin / No PEP)</option>
                  <option value="II">Category II (Superficial Scratch / Vaccine Only)</option>
                  <option value="III">Category III (Transdermal / Vaccine + ERIG/HRIG)</option>
                </select>
              </div>
              <div>
                <label className="block font-extrabold">
                  Mandatory Clinical Override Justification
                </label>
                <textarea
                  rows={3}
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Physical alcohol swab test confirmed micro-abrasion of dermis; upgrading to Category II."
                  className="mt-1 w-full rounded-xl border border-[#DDDCD4] p-3 font-semibold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideTarget(null)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 font-extrabold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingId === overrideTarget.id}
                  className="min-h-[42px] rounded-xl bg-amber-600 px-5 py-2 font-extrabold text-white hover:bg-amber-700"
                >
                  Confirm Clinical Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AEFI REPORTING MODAL */}
      {aefiModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log AEFI Report"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#DDDCD4] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#DDDCD4] pb-3">
              <h2 className="text-base font-extrabold text-red-600">
                Log Adverse Event Following Immunization (AEFI)
              </h2>
              <button
                type="button"
                onClick={() => setAefiModalOpen(false)}
                className="rounded-xl border border-[#DDDCD4] p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAefiSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold">Patient Case</label>
                <select
                  required
                  value={aefiForm.case_id}
                  onChange={(e) =>
                    setAefiForm({ ...aefiForm, case_id: e.target.value })
                  }
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.patient?.full_name || 'Patient'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-extrabold">Reaction Severity</label>
                <select
                  value={aefiForm.severity}
                  onChange={(e) =>
                    setAefiForm({ ...aefiForm, severity: e.target.value })
                  }
                  className="mt-1 min-h-[42px] w-full rounded-xl border border-[#DDDCD4] px-3 py-2 font-extrabold"
                >
                  <option value="mild">Mild (Localized Erythema / Low-Grade Fever)</option>
                  <option value="moderate">Moderate (Generalized Urticaria / Arthralgia)</option>
                  <option value="severe">Severe (Anaphylaxis / Serum Sickness)</option>
                </select>
              </div>
              <div>
                <label className="block font-extrabold">Observed Symptoms</label>
                <textarea
                  rows={2}
                  required
                  value={aefiForm.symptoms}
                  onChange={(e) =>
                    setAefiForm({ ...aefiForm, symptoms: e.target.value })
                  }
                  placeholder="Describe onset, injection site findings, and vital signs..."
                  className="mt-1 w-full rounded-xl border border-[#DDDCD4] p-3 font-semibold"
                />
              </div>
              <div>
                <label className="block font-extrabold">Clinical Action Taken</label>
                <textarea
                  rows={2}
                  required
                  value={aefiForm.action_taken}
                  onChange={(e) =>
                    setAefiForm({ ...aefiForm, action_taken: e.target.value })
                  }
                  placeholder="Antihistamine / observation / regimen continuation notes..."
                  className="mt-1 w-full rounded-xl border border-[#DDDCD4] p-3 font-semibold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAefiModalOpen(false)}
                  className="min-h-[42px] rounded-xl border border-[#DDDCD4] px-4 py-2 font-extrabold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={aefiSubmitting}
                  className="min-h-[42px] rounded-xl bg-red-600 px-5 py-2 font-extrabold text-white hover:bg-red-700"
                >
                  {aefiSubmitting ? 'Saving AEFI...' : 'Save AEFI Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboardPage;

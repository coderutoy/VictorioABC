import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  Search,
  Play,
  Stethoscope,
  Syringe,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ClipboardCheck,
  X,
  UserCheck,
} from 'lucide-react';
import { api } from '../lib/api';
import { useBranch } from '../context/BranchContext';
import { useAuth, ROLES } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';

const VISIT_STATUSES = [
  'Waiting',
  'Triage',
  'For Doctor Order',
  'For Vaccination',
  'Completed',
];

const STATUS_TONE = {
  Waiting: 'amber',
  Triage: 'blue',
  'For Doctor Order': 'red',
  'For Vaccination': 'teal',
  Completed: 'emerald',
};

const WHO_BADGE_TONE = {
  I: 'emerald',
  II: 'amber',
  III: 'red',
};

export function TriagePage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { activeBranchId, activeBranch, canSwitchBranch } = useBranch();

  // Queue state
  const [queue, setQueue] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    Waiting: 0,
    Triage: 0,
    'For Doctor Order': 0,
    'For Vaccination': 0,
    Completed: 0,
  });
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  // QR Scanner / Lookup state
  const [qrInput, setQrInput] = useState('');
  const [scannedPatient, setScannedPatient] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    visit_type: 'new_exposure',
    animal_type: 'Dog',
    animal_status: 'unknown',
    bite_site: 'Right hand / forearm',
    exposure_date: new Date().toISOString().slice(0, 10),
    chief_complaint: '',
  });
  const [checkingIn, setCheckingIn] = useState(false);

  // Nurse Triage Assessment Modal state
  const [triageCase, setTriageCase] = useState(null);
  const [triageForm, setTriageForm] = useState({
    exposure_date: new Date().toISOString().slice(0, 10),
    animal_type: 'Dog',
    animal_status: 'stray',
    bite_site: '',
    animal_observation_status: 'under_observation',
    weight_kg: '',
    blood_pressure: '120/80',
    temperature_c: '36.8',
    allergies: 'None known',
    wound_type: 'bite',
    wound_depth: 'superficial',
    bleeding: true,
    multiple_wounds: false,
    wound_washed: true,
    washed_within_15_min: true,
    antiseptic_applied: false,
    tandok_or_traditional: false,
    previous_rabies_vaccine: false,
    last_tetanus_year: '',
    ai_suggested_category: '',
    clinical_notes: '',
  });
  const [savingTriage, setSavingTriage] = useState(false);

  const scopeLabel = activeBranch
    ? activeBranch.name
    : canSwitchBranch
      ? 'All Branches (HQ)'
      : 'Assigned Branch';

  const fetchQueue = useCallback(async () => {
    setLoadingQueue(true);
    setError('');
    try {
      const params = {};
      if (activeBranchId) params.branch_id = activeBranchId;
      if (activeTab !== 'ALL') params.visit_status = activeTab;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/triage/queue', { params });
      setQueue(res.data?.data?.items || []);
      if (res.data?.data?.summary) {
        setSummary(res.data.data.summary);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load live triage queue.');
    } finally {
      setLoadingQueue(false);
    }
  }, [activeBranchId, activeTab, searchQuery]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleQrLookup = async (e) => {
    e.preventDefault();
    const cleaned = qrInput.trim();
    if (!cleaned) return;
    setScanning(true);
    setError('');
    setScannedPatient(null);
    try {
      const res = await api.get(`/patients/qr/${encodeURIComponent(cleaned)}`);
      setScannedPatient(res.data?.data || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `No patient found matching QR token "${cleaned}". Check the token or register in Patient Registry.`
      );
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmQrCheckIn = async (initialStatus = 'Waiting') => {
    if (!scannedPatient) return;
    setCheckingIn(true);
    setError('');
    try {
      const res = await api.post('/triage/check-in', {
        patient_id: scannedPatient.id,
        qr_code_hash: scannedPatient.qr_code_hash,
        branch_id: activeBranchId || scannedPatient.registered_branch_id || undefined,
        visit_type: checkInForm.visit_type,
        visit_status: initialStatus,
        exposure_date: checkInForm.exposure_date,
        animal_type: checkInForm.animal_type,
        animal_status: checkInForm.animal_status,
        bite_site: checkInForm.bite_site,
        chief_complaint: checkInForm.chief_complaint,
      });
      const createdVisit = res.data?.data;
      setBanner(
        `QR Check-In Confirmed: ${scannedPatient.full_name} assigned Queue #${createdVisit?.clinical_context?.queue_number} (${createdVisit?.visit_status}).`
      );
      setScannedPatient(null);
      setQrInput('');
      await fetchQueue();

      if (initialStatus === 'Triage' && createdVisit) {
        openTriageModal(createdVisit);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'QR Check-In failed.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleStatusTransition = async (visitCase, nextStatus) => {
    setError('');
    try {
      await api.patch(`/triage/cases/${visitCase.id}/status`, {
        visit_status: nextStatus,
      });
      setBanner(
        `Updated ${visitCase.patient?.full_name || 'Patient'} visit status to "${nextStatus}".`
      );
      await fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update visit status.');
    }
  };

  const openTriageModal = (visitCase) => {
    const ctx = visitCase.clinical_context || {};
    setTriageCase(visitCase);
    setTriageForm({
      exposure_date: visitCase.exposure_date || new Date().toISOString().slice(0, 10),
      animal_type: visitCase.animal_type || 'Dog',
      animal_status: visitCase.animal_status || 'stray',
      bite_site:
        visitCase.bite_site === 'Pending Triage Assessment' ? '' : visitCase.bite_site || '',
      animal_observation_status: visitCase.animal_observation_status || 'under_observation',
      weight_kg: ctx.weight_kg ?? '',
      blood_pressure: ctx.blood_pressure || '120/80',
      temperature_c: ctx.temperature_c ?? '36.8',
      allergies: ctx.allergies || 'None known',
      wound_type: ctx.wound_type || 'bite',
      wound_depth: ctx.wound_depth || 'superficial',
      bleeding: ctx.bleeding ?? true,
      multiple_wounds: ctx.multiple_wounds ?? false,
      wound_washed: ctx.wound_washed ?? true,
      washed_within_15_min: ctx.washed_within_15_min ?? true,
      antiseptic_applied: ctx.antiseptic_applied ?? false,
      tandok_or_traditional: ctx.tandok_or_traditional ?? false,
      previous_rabies_vaccine: ctx.previous_rabies_vaccine ?? false,
      last_tetanus_year: ctx.last_tetanus_year || '',
      ai_suggested_category: visitCase.ai_suggested_category || '',
      clinical_notes: visitCase.clinical_notes || '',
    });
  };

  const handleSaveTriage = async (e) => {
    e.preventDefault();
    if (!triageCase) return;
    setSavingTriage(true);
    setError('');
    try {
      const payload = {
        exposure_date: triageForm.exposure_date,
        animal_type: triageForm.animal_type,
        animal_status: triageForm.animal_status,
        bite_site: triageForm.bite_site.trim() || 'Right forearm',
        animal_observation_status: triageForm.animal_observation_status,
        weight_kg: triageForm.weight_kg ? Number(triageForm.weight_kg) : null,
        blood_pressure: triageForm.blood_pressure,
        temperature_c: triageForm.temperature_c ? Number(triageForm.temperature_c) : null,
        allergies: triageForm.allergies,
        wound_type: triageForm.wound_type,
        wound_depth: triageForm.wound_depth,
        bleeding: Boolean(triageForm.bleeding),
        multiple_wounds: Boolean(triageForm.multiple_wounds),
        wound_washed: Boolean(triageForm.wound_washed),
        washed_within_15_min: Boolean(triageForm.washed_within_15_min),
        antiseptic_applied: Boolean(triageForm.antiseptic_applied),
        tandok_or_traditional: Boolean(triageForm.tandok_or_traditional),
        previous_rabies_vaccine: Boolean(triageForm.previous_rabies_vaccine),
        last_tetanus_year: triageForm.last_tetanus_year,
        ...(triageForm.ai_suggested_category
          ? { ai_suggested_category: triageForm.ai_suggested_category }
          : {}),
        clinical_notes: triageForm.clinical_notes,
        visit_status: 'For Doctor Order',
      };

      await api.put(`/triage/cases/${triageCase.id}/assessment`, payload);
      setBanner(
        `Completed Nurse Triage for ${triageCase.patient?.full_name}. Visit moved to "For Doctor Order".`
      );
      setTriageCase(null);
      await fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save triage assessment.');
    } finally {
      setSavingTriage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">QR Check-In &amp; Triage Queue</h1>
            <Badge tone="teal">Scope: {scopeLabel}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Scan patient QR passes, record wound triage assessments, and track live clinic visit stages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fetchQueue}>
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Queue</span>
          </Button>
          <Button variant="primary" onClick={() => navigate('/clinical-orders')}>
            <Stethoscope className="h-4 w-4" />
            <span>Doctor Clinical Orders</span>
          </Button>
        </div>
      </div>

      {banner && (
        <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <span>{banner}</span>
          <button type="button" onClick={() => setBanner('')} className="text-brand-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* QR Code Check-In Scanner / Lookup Card */}
      <Card
        title="Reception & Nurse QR Check-In Scanner"
        subtitle="Scan a patient's QR pass with a USB/camera barcode reader or paste their VABC QR token below."
      >
        <form onSubmit={handleQrLookup} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <QrCode className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-brand-600" />
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Scan or enter Patient QR Code Token (e.g. VABC-A1B2C3D4E5F6)..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 font-mono text-sm text-slate-900 placeholder-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <Button type="submit" variant="primary" disabled={scanning}>
            <Search className="h-4 w-4" />
            <span>{scanning ? 'Looking up QR...' : 'Lookup QR Pass'}</span>
          </Button>
        </form>

        {scannedPatient && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-brand-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    {scannedPatient.full_name}
                  </h3>
                  <code className="rounded bg-white px-2 py-0.5 font-mono text-xs font-bold text-brand-700 ring-1 ring-brand-200">
                    {scannedPatient.qr_code_hash}
                  </code>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  DOB: {scannedPatient.birthdate} ({scannedPatient.gender}) &bull; Phone:{' '}
                  {scannedPatient.phone || 'N/A'} &bull; {scannedPatient.address}, Brgy.{' '}
                  {scannedPatient.barangay}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setScannedPatient(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Visit Type</label>
                <select
                  value={checkInForm.visit_type}
                  onChange={(e) => setCheckInForm({ ...checkInForm, visit_type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                >
                  <option value="new_exposure">New Animal Bite Exposure</option>
                  <option value="follow_up_dose">Follow-Up PEP Dose Visit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Biting Animal</label>
                <select
                  value={checkInForm.animal_type}
                  onChange={(e) => setCheckInForm({ ...checkInForm, animal_type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                >
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bat">Bat</option>
                  <option value="Monkey">Monkey</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Bite Site</label>
                <input
                  type="text"
                  value={checkInForm.bite_site}
                  onChange={(e) => setCheckInForm({ ...checkInForm, bite_site: e.target.value })}
                  placeholder="e.g. Right calf / hand"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Exposure Date</label>
                <input
                  type="date"
                  value={checkInForm.exposure_date}
                  onChange={(e) =>
                    setCheckInForm({ ...checkInForm, exposure_date: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={checkingIn}
                onClick={() => handleConfirmQrCheckIn('Waiting')}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Check In to Waiting Queue</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={checkingIn}
                onClick={() => handleConfirmQrCheckIn('Triage')}
              >
                <Play className="h-3.5 w-3.5" />
                <span>Check In &amp; Start Nurse Triage Now</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Live Visit Status Pipeline Summary KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`rounded-xl border p-3.5 text-left transition ${
            activeTab === 'ALL'
              ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-200'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <p className="text-xs font-medium text-slate-500">All Visits</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p>
        </button>

        {VISIT_STATUSES.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setActiveTab(st)}
            className={`rounded-xl border p-3.5 text-left transition ${
              activeTab === st
                ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-200'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">{st}</span>
              <Badge tone={STATUS_TONE[st]}>{summary[st] || 0}</Badge>
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary[st] || 0}</p>
          </button>
        ))}
      </div>

      {/* Live Queue Table */}
      <Card
        title={`Live Patient Visit Queue (${queue.length})`}
        subtitle="Track patient progression across Waiting -> Triage -> For Doctor Order -> For Vaccination -> Completed."
        action={
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter queue by name, QR, queue #..."
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-2.5 text-xs text-slate-900 focus:border-brand-600 focus:outline-none"
            />
          </div>
        }
      >
        {loadingQueue ? (
          <Spinner label="Loading live patient queue..." />
        ) : queue.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No patient visits in <strong>{activeTab === 'ALL' ? 'the queue' : activeTab}</strong>.
            Scan a patient QR token above or check in a patient from the Patient Registry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Queue # &amp; Patient</th>
                  <th className="px-4 py-3">Exposure &amp; Wound Assessment</th>
                  <th className="px-4 py-3">WHO Category</th>
                  <th className="px-4 py-3">Live Visit Status</th>
                  <th className="px-4 py-3 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {queue.map((item) => {
                  const ctx = item.clinical_context || {};
                  const cat = item.doctor_validated_category || item.ai_suggested_category;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                            {ctx.queue_number || 'WALK-IN'}
                          </span>
                          <span className="font-semibold text-slate-900">
                            {item.patient?.full_name || 'Unknown Patient'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <code className="font-mono text-[11px] text-brand-700">
                            {item.patient?.qr_code_hash}
                          </code>
                          <span>&bull; Brgy. {item.patient?.barangay}</span>
                          {ctx.weight_kg && <span>&bull; {ctx.weight_kg} kg</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="font-medium text-slate-800">
                          {item.animal_type} ({item.animal_status?.replace('_', ' ')}) &mdash;{' '}
                          {item.bite_site}
                        </div>
                        <div className="mt-0.5 text-slate-500">
                          Exposed: {item.exposure_date}
                          {ctx.wound_depth && ` • Depth: ${ctx.wound_depth}`}
                          {ctx.bleeding ? ' • Bleeding' : ''}
                          {ctx.tandok_or_traditional ? ' • ⚠ Tandok History' : ''}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {cat ? (
                          <div className="space-y-1">
                            <Badge tone={WHO_BADGE_TONE[cat] || 'slate'}>
                              WHO Category {cat}
                            </Badge>
                            <div className="text-[11px] text-slate-500">
                              {item.doctor_validated_category
                                ? 'Doctor Validated'
                                : 'Nurse Triage Preliminary'}
                            </div>
                          </div>
                        ) : (
                          <Badge tone="slate">Unclassified</Badge>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <Badge tone={STATUS_TONE[item.visit_status] || 'slate'}>
                            {item.visit_status}
                          </Badge>
                          <select
                            aria-label="Change visit status"
                            value={item.visit_status}
                            onChange={(e) => handleStatusTransition(item, e.target.value)}
                            className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-600"
                          >
                            {VISIT_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                Move to: {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          {item.visit_status === 'Waiting' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={async () => {
                                await handleStatusTransition(item, 'Triage');
                                openTriageModal({ ...item, visit_status: 'Triage' });
                              }}
                            >
                              <Play className="h-3.5 w-3.5" />
                              <span>Start Triage</span>
                            </Button>
                          )}

                          {(item.visit_status === 'Triage' ||
                            item.visit_status === 'Waiting') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openTriageModal(item)}
                            >
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              <span>Triage Form</span>
                            </Button>
                          )}

                          {item.visit_status === 'For Doctor Order' &&
                            (role === ROLES.DOCTOR || role === ROLES.ADMIN) && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  navigate(`/clinical-orders?case_id=${item.id}`)
                                }
                              >
                                <Stethoscope className="h-3.5 w-3.5" />
                                <span>Doctor Order</span>
                              </Button>
                            )}

                          {item.visit_status === 'For Vaccination' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                navigate(`/clinical-orders?case_id=${item.id}&tab=vaccinate`)
                              }
                            >
                              <Syringe className="h-3.5 w-3.5" />
                              <span>Administer Dose</span>
                            </Button>
                          )}

                          {item.visit_status !== 'Completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusTransition(item, 'Completed')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Complete</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Nurse Triage & Wound Assessment Modal */}
      {triageCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Nurse Triage &amp; Wound Assessment — {triageCase.patient?.full_name}
                </h2>
                <p className="text-xs text-slate-500">
                  Queue #{triageCase.clinical_context?.queue_number || 'Walk-in'} &bull; QR:{' '}
                  {triageCase.patient?.qr_code_hash}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTriageCase(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-4 p-6 max-h-[80vh] overflow-y-auto">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  id="triage_exposure_date"
                  label="Exposure Date *"
                  type="date"
                  required
                  value={triageForm.exposure_date}
                  onChange={(e) =>
                    setTriageForm({ ...triageForm, exposure_date: e.target.value })
                  }
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Biting Animal Type *
                  </label>
                  <select
                    value={triageForm.animal_type}
                    onChange={(e) =>
                      setTriageForm({ ...triageForm, animal_type: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bat">Bat</option>
                    <option value="Monkey">Monkey</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Animal Vaccination Status *
                  </label>
                  <select
                    value={triageForm.animal_status}
                    onChange={(e) =>
                      setTriageForm({ ...triageForm, animal_status: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="stray">Stray / Free-Roaming</option>
                    <option value="domestic_unvaccinated">Pet / Domestic (Unvaccinated)</option>
                    <option value="domestic_vaccinated">Pet / Domestic (Vaccinated)</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="triage_bite_site"
                  label="Anatomical Bite / Exposure Site *"
                  required
                  placeholder="e.g. Right index finger, Left lower leg"
                  value={triageForm.bite_site}
                  onChange={(e) => setTriageForm({ ...triageForm, bite_site: e.target.value })}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    14-Day Animal Observation Status
                  </label>
                  <select
                    value={triageForm.animal_observation_status}
                    onChange={(e) =>
                      setTriageForm({
                        ...triageForm,
                        animal_observation_status: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="under_observation">Under 14-Day Observation</option>
                    <option value="alive_healthy">Alive &amp; Healthy</option>
                    <option value="lost_stray">Lost / Unobservable Stray</option>
                    <option value="died">Animal Died</option>
                    <option value="killed_tested">Killed / Submitted for Testing</option>
                  </select>
                </div>
              </div>

              {/* Vitals */}
              <div className="grid gap-4 sm:grid-cols-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <Input
                  id="weight_kg"
                  label="Weight (kg) [For ERIG]"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 62.5"
                  value={triageForm.weight_kg}
                  onChange={(e) => setTriageForm({ ...triageForm, weight_kg: e.target.value })}
                />
                <Input
                  id="blood_pressure"
                  label="Blood Pressure"
                  placeholder="120/80"
                  value={triageForm.blood_pressure}
                  onChange={(e) =>
                    setTriageForm({ ...triageForm, blood_pressure: e.target.value })
                  }
                />
                <Input
                  id="temperature_c"
                  label="Temp (°C)"
                  type="number"
                  step="0.1"
                  value={triageForm.temperature_c}
                  onChange={(e) =>
                    setTriageForm({ ...triageForm, temperature_c: e.target.value })
                  }
                />
                <Input
                  id="allergies"
                  label="Known Allergies"
                  placeholder="e.g. Equine serum, None"
                  value={triageForm.allergies}
                  onChange={(e) => setTriageForm({ ...triageForm, allergies: e.target.value })}
                />
              </div>

              {/* Wound Characteristics */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Exposure Type</label>
                  <select
                    value={triageForm.wound_type}
                    onChange={(e) => setTriageForm({ ...triageForm, wound_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="bite">Bite / Puncture Wound</option>
                    <option value="scratch">Scratch / Abrasion</option>
                    <option value="lick_broken_skin">Saliva on Broken Skin / Mucosa</option>
                    <option value="intact_skin_contact">Lick / Touch on Intact Skin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Wound Depth</label>
                  <select
                    value={triageForm.wound_depth}
                    onChange={(e) =>
                      setTriageForm({ ...triageForm, wound_depth: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="intact">Intact Skin (No Break)</option>
                    <option value="superficial">Superficial (Epidermis Only)</option>
                    <option value="deep_transdermal">Deep / Transdermal Puncture</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Preliminary WHO Category
                  </label>
                  <select
                    value={triageForm.ai_suggested_category}
                    onChange={(e) =>
                      setTriageForm({
                        ...triageForm,
                        ai_suggested_category: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="">Auto-Suggest from Wound Findings</option>
                    <option value="I">Category I (No Exposure / Intact Skin)</option>
                    <option value="II">Category II (Minor Scratch / No Bleeding)</option>
                    <option value="III">Category III (Transdermal / Bleeding / Mucosa)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3 rounded-xl border border-slate-200 p-3.5 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triageForm.bleeding}
                    onChange={(e) =>
                      setTriageForm({ ...triageForm, bleeding: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  <span>Active / Spontaneous Bleeding</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triageForm.multiple_wounds}
                    onChange={(e) =>
                      setTriageForm({ ...triageForm, multiple_wounds: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  <span>Multiple Bite / Scratch Wounds</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triageForm.wound_washed}
                    onChange={(e) =>
                      setTriageForm({ ...triageForm, wound_washed: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  <span>Washed with Soap &amp; Running Water</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triageForm.antiseptic_applied}
                    onChange={(e) =>
                      setTriageForm({ ...triageForm, antiseptic_applied: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  <span>Povidone-Iodine / Alcohol Applied</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-amber-800 font-medium">
                  <input
                    type="checkbox"
                    checked={triageForm.tandok_or_traditional}
                    onChange={(e) =>
                      setTriageForm({
                        ...triageForm,
                        tandok_or_traditional: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-amber-600"
                  />
                  <span>Tandok / Garlic / Traditional Treatment Applied</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triageForm.previous_rabies_vaccine}
                    onChange={(e) =>
                      setTriageForm({
                        ...triageForm,
                        previous_rabies_vaccine: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                  />
                  <span>History of Prior Rabies PEP Vaccination</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Nurse Triage &amp; Wound Observations
                </label>
                <textarea
                  rows={2}
                  value={triageForm.clinical_notes}
                  onChange={(e) =>
                    setTriageForm({ ...triageForm, clinical_notes: e.target.value })
                  }
                  placeholder="Describe wound dimensions, first-aid washing performed at clinic, patient condition..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <Button variant="secondary" onClick={() => setTriageCase(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={savingTriage}>
                  <Stethoscope className="h-4 w-4" />
                  <span>
                    {savingTriage
                      ? 'Saving Triage...'
                      : 'Complete Triage & Send to Doctor Order'}
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

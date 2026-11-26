import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  QrCode,
  ShieldCheck,
  Edit3,
  Eye,
  LogIn,
  RefreshCw,
  MapPin,
  Phone,
  Calendar,
  FileText,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { QrCodeCard } from '../components/ui/QrCodeCard';

const SJDM_BARANGAYS = [
  'Tungkong Mangga',
  'Muzon',
  'Gaya-Gaya',
  'Graceville',
  'Kaypian',
  'Minuyan',
  'Sapang Palay',
  'Sto. Cristo',
  'Citrus',
  'Fatima',
  'Francisco Homes',
  'San Manuel',
  'San Pedro',
  'Santa Cruz',
];

const VISIT_STATUS_TONE = {
  Waiting: 'amber',
  Triage: 'blue',
  'For Doctor Order': 'red',
  'For Vaccination': 'teal',
  Completed: 'emerald',
};

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  birthdate: '',
  gender: 'male',
  address: '',
  barangay: 'Tungkong Mangga',
  municipality: 'San Jose del Monte',
  government_id: '',
  registered_branch_id: '',
  check_in_now: true,
  chief_complaint: '',
};

export function PatientsPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { branches, activeBranchId, activeBranch, canSwitchBranch } = useBranch();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');

  // Registration / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Patient Detail & QR Modal state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [checkingInId, setCheckingInId] = useState(null);
  const [bannerMessage, setBannerMessage] = useState('');

  const scopeLabel = activeBranch
    ? activeBranch.name
    : canSwitchBranch
      ? 'All Branches (HQ)'
      : 'Assigned Branch';

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (branchFilter === 'active_branch' && activeBranchId) {
        params.branch_id = activeBranchId;
      }
      const res = await api.get('/patients', { params });
      setPatients(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load patients.');
    } finally {
      setLoading(false);
    }
  }, [search, branchFilter, activeBranchId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const openRegisterModal = () => {
    setEditingPatient(null);
    setForm({
      ...EMPTY_FORM,
      registered_branch_id: activeBranchId || branches[0]?.id || '',
      check_in_now: true,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (patient) => {
    setEditingPatient(patient);
    setForm({
      full_name: patient.full_name || '',
      phone: patient.phone || '',
      birthdate: patient.birthdate || '',
      gender: patient.gender || 'male',
      address: patient.address || '',
      barangay: patient.barangay || 'Tungkong Mangga',
      municipality: patient.municipality || 'San Jose del Monte',
      government_id: patient.government_id || '',
      registered_branch_id: patient.registered_branch_id || activeBranchId || '',
      check_in_now: false,
      chief_complaint: '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openPatientProfile = async (patientId) => {
    setLoadingDetail(true);
    setError('');
    try {
      const res = await api.get(`/patients/${patientId}`);
      setSelectedPatient(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patient details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        birthdate: form.birthdate,
        gender: form.gender,
        address: form.address.trim(),
        barangay: form.barangay.trim(),
        municipality: form.municipality.trim() || 'San Jose del Monte',
        government_id: form.government_id.trim() || null,
        ...(form.registered_branch_id ? { registered_branch_id: form.registered_branch_id } : {}),
      };

      if (editingPatient) {
        const res = await api.put(`/patients/${editingPatient.id}`, payload);
        const updated = res.data?.data;
        setBannerMessage(`Updated profile for ${updated.full_name} (PII encrypted via AES-256-GCM).`);
        if (selectedPatient?.id === updated.id) {
          await openPatientProfile(updated.id);
        }
      } else {
        const res = await api.post('/patients', {
          ...payload,
          check_in_now: Boolean(form.check_in_now),
          chief_complaint: form.chief_complaint.trim() || 'Walk-in registration intake',
        });
        const created = res.data?.data;
        const checkedIn = res.data?.check_in;
        setBannerMessage(
          checkedIn
            ? `Registered ${created.full_name} (QR: ${created.qr_code_hash}) and checked into queue (${checkedIn.clinical_context?.queue_number}).`
            : `Registered ${created.full_name} with QR token ${created.qr_code_hash}.`
        );
        await openPatientProfile(created.id);
      }

      setIsFormOpen(false);
      await fetchPatients();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save patient.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickCheckIn = async (patient) => {
    setCheckingInId(patient.id);
    setError('');
    try {
      const res = await api.post('/triage/check-in', {
        patient_id: patient.id,
        branch_id: activeBranchId || patient.registered_branch_id || undefined,
        chief_complaint: 'QR Walk-in Check-In from Patient Registry',
      });
      const visit = res.data?.data;
      setBannerMessage(
        `${patient.full_name} checked into live queue as ${visit?.clinical_context?.queue_number || 'Waiting'} (${visit?.visit_status}).`
      );
      await fetchPatients();
      if (selectedPatient?.id === patient.id) {
        await openPatientProfile(patient.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in patient.');
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Patient Registry</h1>
            <Badge tone="teal">Scope: {scopeLabel}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Multi-branch patient demographics, AES-256-GCM PII protection, and unique QR pass generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/triage')}>
            <QrCode className="h-4 w-4" />
            <span>Open QR Check-In Queue</span>
          </Button>
          <Button variant="primary" onClick={openRegisterModal}>
            <UserPlus className="h-4 w-4" />
            <span>Register Patient</span>
          </Button>
        </div>
      </div>

      {/* Security & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs text-emerald-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            <strong>AES-256-GCM PII Encryption Active:</strong> Patient contact numbers, street addresses, and government IDs are encrypted with random IVs + auth tags before Supabase writes.
          </span>
        </div>
        <span className="font-medium">Role: {role?.toUpperCase()}</span>
      </div>

      {bannerMessage && (
        <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <span>{bannerMessage}</span>
          <button
            type="button"
            onClick={() => setBannerMessage('')}
            className="text-brand-700 hover:text-brand-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search & Filter Controls */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by full name, QR code (e.g. VABC-...), phone number, barangay, or Gov ID..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-600 focus:outline-none"
            >
              <option value="all">All Victorio ABC Branches (Global Registry)</option>
              {activeBranchId && (
                <option value="active_branch">
                  Registered at {activeBranch?.name || 'Current Branch'} Only
                </option>
              )}
            </select>
            <Button variant="secondary" onClick={fetchPatients}>
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Patient Directory Table */}
      <Card
        title={`Registered Patients (${patients.length})`}
        subtitle="Global patient records accessible for cross-branch PEP doses and QR check-in."
      >
        {loading ? (
          <Spinner label="Loading patient registry..." />
        ) : patients.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-slate-700">No patient records found.</p>
            <p className="mt-1 text-xs text-slate-500">
              Click &ldquo;Register Patient&rdquo; to create a new record and generate a QR code pass.
            </p>
            <div className="mt-4">
              <Button variant="primary" onClick={openRegisterModal}>
                <UserPlus className="h-4 w-4" />
                <span>Register First Patient</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Patient &amp; QR Token</th>
                  <th className="px-4 py-3">Demographics</th>
                  <th className="px-4 py-3">Contact &amp; Address (Decrypted)</th>
                  <th className="px-4 py-3">Registered Branch</th>
                  <th className="px-4 py-3">Latest Visit Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {patients.map((patient) => {
                  const latest = patient.latest_case;
                  const statusTone = latest
                    ? VISIT_STATUS_TONE[latest.visit_status] || 'slate'
                    : 'slate';

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{patient.full_name}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <code className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                            {patient.qr_code_hash}
                          </code>
                          {patient.government_id && (
                            <span className="text-[11px] text-slate-500">
                              ID: {patient.government_id}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="capitalize font-medium text-slate-800">
                          {patient.gender}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>DOB: {patient.birthdate}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-medium text-slate-800">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{patient.phone || 'No phone on file'}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-slate-500">
                          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate max-w-xs">
                            {patient.address}, Brgy. {patient.barangay}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        {patient.registered_branch?.name || 'Global / Walk-in'}
                      </td>

                      <td className="px-4 py-3">
                        {latest ? (
                          <div className="space-y-1">
                            <Badge tone={statusTone}>{latest.visit_status}</Badge>
                            {latest.doctor_validated_category && (
                              <div className="text-[11px] font-medium text-slate-500">
                                WHO Cat {latest.doctor_validated_category} &bull; {latest.animal_type}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge tone="slate">No Active Visit</Badge>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openPatientProfile(patient.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>QR &amp; Profile</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(patient)}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={checkingInId === patient.id}
                            onClick={() => handleQuickCheckIn(patient)}
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            <span>
                              {checkingInId === patient.id ? 'Checking In...' : 'Check In'}
                            </span>
                          </Button>
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

      {/* Selected Patient Profile & QR Pass Drawer / Section */}
      {(loadingDetail || selectedPatient) && (
        <Card
          title={
            selectedPatient
              ? `Patient Record & QR Pass — ${selectedPatient.full_name}`
              : 'Loading Patient Profile...'
          }
          subtitle="Includes scannable QR code token, decrypted PII demographics, and multi-branch PEP history."
          action={
            selectedPatient && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => openEditModal(selectedPatient)}>
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        >
          {loadingDetail ? (
            <Spinner label="Decrypting patient profile & clinical history..." />
          ) : (
            selectedPatient && (
              <div className="space-y-6">
                <QrCodeCard patient={selectedPatient} onCheckIn={handleQuickCheckIn} />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Contact Number (AES-256-GCM)</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedPatient.phone || 'Not provided'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Street Address &amp; Barangay</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedPatient.address}, Brgy. {selectedPatient.barangay}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Birthdate &amp; Gender</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
                      {selectedPatient.birthdate} ({selectedPatient.gender})
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Government / PhilHealth ID</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedPatient.government_id || 'None on file'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Clinical Encounters &amp; PEP Vaccination History ({selectedPatient.bite_cases?.length || 0})
                  </h3>
                  {!selectedPatient.bite_cases?.length ? (
                    <p className="mt-2 text-xs text-slate-500">
                      No bite exposure episodes recorded yet. Click &ldquo;Check In to Queue&rdquo; above to start an encounter.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {selectedPatient.bite_cases.map((bc) => (
                        <div
                          key={bc.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge tone={VISIT_STATUS_TONE[bc.visit_status] || 'slate'}>
                                {bc.visit_status}
                              </Badge>
                              {bc.clinical_context?.queue_number && (
                                <Badge tone="slate">{bc.clinical_context.queue_number}</Badge>
                              )}
                              <span className="text-sm font-semibold text-slate-900">
                                {bc.animal_type} Exposure — {bc.bite_site}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              Exposure Date: {bc.exposure_date} &bull; {bc.branch?.name || 'Branch'}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span>
                              WHO Category:{' '}
                              <strong>
                                {bc.doctor_validated_category
                                  ? `Category ${bc.doctor_validated_category} (Doctor Validated)`
                                  : bc.ai_suggested_category
                                    ? `Category ${bc.ai_suggested_category} (Preliminary)`
                                    : 'Pending Assessment'}
                              </strong>
                            </span>
                            {bc.doctor?.full_name && (
                              <span>Attending MD: Dr. {bc.doctor.full_name}</span>
                            )}
                            {bc.certificate_code && (
                              <Badge tone="emerald">Cert: {bc.certificate_code}</Badge>
                            )}
                          </div>

                          {bc.pep_schedules?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {bc.pep_schedules.map((sched) => (
                                <div
                                  key={sched.id}
                                  className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                                    sched.status === 'completed'
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                      : 'border-slate-200 bg-white text-slate-700'
                                  }`}
                                >
                                  <span className="font-semibold">{sched.dose_number}:</span>{' '}
                                  {sched.scheduled_date}{' '}
                                  <span className="uppercase text-[10px] font-bold">
                                    ({sched.status})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </Card>
      )}

      {/* Patient Registration / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingPatient ? 'Edit Patient Profile' : 'Register New Patient'}
                </h2>
                <p className="text-xs text-slate-500">
                  Sensitive PII fields are encrypted with AES-256-GCM prior to database storage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 p-6">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="full_name"
                  label="Full Name *"
                  required
                  placeholder="e.g. Juan Dela Cruz"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
                <Input
                  id="phone"
                  label="Contact Number (AES-256-GCM Encrypted)"
                  placeholder="e.g. +63 917 555 0199"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  id="birthdate"
                  label="Birthdate *"
                  type="date"
                  required
                  value={form.birthdate}
                  onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                />

                <div className="space-y-1.5">
                  <label htmlFor="gender" className="block text-sm font-medium text-slate-700">
                    Sex / Gender *
                  </label>
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <Input
                  id="government_id"
                  label="Gov / PhilHealth ID (Encrypted)"
                  placeholder="e.g. PhilSys / PhilHealth #"
                  value={form.government_id}
                  onChange={(e) => setForm({ ...form, government_id: e.target.value })}
                />
              </div>

              <Input
                id="address"
                label="House / Lot / Street Address * (AES-256-GCM Encrypted)"
                required
                placeholder="e.g. Blk 4 Lot 12 Quirino Highway"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="barangay" className="block text-sm font-medium text-slate-700">
                    Barangay *
                  </label>
                  <input
                    id="barangay"
                    list="sjdm-barangays"
                    required
                    value={form.barangay}
                    onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <datalist id="sjdm-barangays">
                    {SJDM_BARANGAYS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                <Input
                  id="municipality"
                  label="Municipality / City *"
                  required
                  value={form.municipality}
                  onChange={(e) => setForm({ ...form, municipality: e.target.value })}
                />

                <div className="space-y-1.5">
                  <label
                    htmlFor="registered_branch_id"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Registered Branch
                  </label>
                  <select
                    id="registered_branch_id"
                    disabled={!canSwitchBranch && Boolean(activeBranchId)}
                    value={form.registered_branch_id}
                    onChange={(e) => setForm({ ...form, registered_branch_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingPatient && (
                <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3.5 space-y-3">
                  <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.check_in_now}
                      onChange={(e) => setForm({ ...form, check_in_now: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>
                      Immediately check patient into today&apos;s Triage Queue (Status: <strong>Waiting</strong>)
                    </span>
                  </label>

                  {form.check_in_now && (
                    <Input
                      id="chief_complaint"
                      label="Initial Chief Complaint / Intake Note"
                      placeholder="e.g. Dog bite on right forearm this morning"
                      value={form.chief_complaint}
                      onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })}
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  <FileText className="h-4 w-4" />
                  <span>
                    {submitting
                      ? 'Encrypting & Saving...'
                      : editingPatient
                        ? 'Save Profile Changes'
                        : 'Register & Generate QR Pass'}
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

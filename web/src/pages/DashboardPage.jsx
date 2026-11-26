import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, QrCode, Stethoscope, Syringe, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

export function DashboardPage() {
  const navigate = useNavigate();
  const { profile, role } = useAuth();
  const { activeBranchId, activeBranch, canSwitchBranch } = useBranch();

  const [stats, setStats] = useState({
    patientsCount: '—',
    waitingAndTriage: '—',
    forDoctorOrder: '—',
    forVaccination: '—',
    completedVisits: '—',
  });

  useEffect(() => {
    let mounted = true;
    async function loadDashboardStats() {
      try {
        const params = activeBranchId ? { branch_id: activeBranchId } : {};
        const [patientsRes, queueRes] = await Promise.all([
          api.get('/patients', { params }),
          api.get('/triage/queue', { params }),
        ]);
        if (!mounted) return;
        const pList = patientsRes.data?.data || [];
        const qSummary = queueRes.data?.data?.summary || {};
        setStats({
          patientsCount: pList.length,
          waitingAndTriage: (qSummary.Waiting || 0) + (qSummary.Triage || 0),
          forDoctorOrder: qSummary['For Doctor Order'] || 0,
          forVaccination: qSummary['For Vaccination'] || 0,
          completedVisits: qSummary.Completed || 0,
        });
      } catch {
        // Ignore on initial load if offline
      }
    }
    loadDashboardStats();
    return () => {
      mounted = false;
    };
  }, [activeBranchId]);

  const scopeLabel = activeBranch
    ? `${activeBranch.name} (Brgy. ${activeBranch.barangay})`
    : canSwitchBranch
      ? 'All Branches (HQ View)'
      : 'Assigned Branch';

  const kpis = [
    {
      label: 'Registered Patients',
      value: stats.patientsCount,
      tone: 'teal',
      badge: 'AES-256-GCM',
      to: '/patients',
    },
    {
      label: 'Waiting & In Triage',
      value: stats.waitingAndTriage,
      tone: 'amber',
      badge: 'QR Queue',
      to: '/triage',
    },
    {
      label: 'Awaiting Doctor Order',
      value: stats.forDoctorOrder,
      tone: 'red',
      badge: 'WHO Cat I-III',
      to: '/clinical-orders',
    },
    {
      label: 'For Vaccination / Completed',
      value: `${stats.forVaccination} / ${stats.completedVisits}`,
      tone: 'emerald',
      badge: 'PEP Doses',
      to: '/schedules',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {profile?.full_name || 'Clinician'}
          </h1>
          <p className="text-sm text-slate-500">
            Active workspace: <span className="font-medium text-slate-700">{scopeLabel}</span>
          </p>
        </div>
        <Badge tone="teal">Role: {role?.toUpperCase()}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <Card key={item.label}>
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{item.value}</span>
              <Badge tone={item.tone}>{item.badge}</Badge>
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => navigate(item.to)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                <span>Open Module</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Card
        title="Phase 2 Clinical Workflow Quick Actions"
        subtitle="End-to-end Patient Registry, QR Check-In, Triage Assessment, Doctor Clinical Orders, and PEP Administration."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="primary" onClick={() => navigate('/patients')}>
            <Users className="h-4 w-4" />
            <span>Register &amp; Lookup Patients</span>
          </Button>
          <Button variant="secondary" onClick={() => navigate('/triage')}>
            <QrCode className="h-4 w-4" />
            <span>QR Check-In &amp; Triage Queue</span>
          </Button>
          <Button variant="secondary" onClick={() => navigate('/clinical-orders')}>
            <Stethoscope className="h-4 w-4" />
            <span>Issue Doctor Clinical Order</span>
          </Button>
          <Button variant="secondary" onClick={() => navigate('/schedules')}>
            <Syringe className="h-4 w-4" />
            <span>Administer PEP Doses</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}

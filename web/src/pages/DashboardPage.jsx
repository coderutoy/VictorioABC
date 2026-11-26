import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

export function DashboardPage() {
  const { profile, role } = useAuth();
  const { activeBranch, canSwitchBranch } = useBranch();

  const scopeLabel = activeBranch
    ? `${activeBranch.name} (${activeBranch.code})`
    : canSwitchBranch
      ? 'All Branches (HQ View)'
      : 'Assigned Branch';

  const kpis = [
    { label: 'Pending AI Triage Reviews', value: '—', tone: 'amber' },
    { label: 'Scheduled PEP Doses Today', value: '—', tone: 'teal' },
    { label: 'Low-Stock / Expiring Batches', value: '—', tone: 'red' },
    { label: 'Completed Visits (Today)', value: '—', tone: 'emerald' },
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
              <Badge tone={item.tone}>Ready</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card
        title="Clinical Workflow Status"
        subtitle="Frontend shell connected to AuthContext, BranchContext, and RoleRoute guards."
      >
        <p className="text-sm text-slate-600">
          Use the sidebar to navigate across Patients, AI Triage Queue, Clinical Orders, PEP Schedules,
          Vaccine Inventory, and Audit Logs. Live database widgets will bind here in the next implementation phase.
        </p>
      </Card>
    </div>
  );
}

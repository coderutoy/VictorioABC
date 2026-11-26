import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useBranch } from '../context/BranchContext';

export function TriagePage() {
  const { activeBranch, canSwitchBranch } = useBranch();
  const scopeLabel = activeBranch
    ? activeBranch.name
    : canSwitchBranch
      ? 'All Branches (HQ)'
      : 'Assigned Branch';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Wound Triage Queue</h1>
          <p className="text-sm text-slate-500">Review CNN Category I-III predictions, confidence scores, and physician verification overrides.</p>
        </div>
        <Badge tone="teal">Scope: {scopeLabel}</Badge>
      </div>

      <Card title="Module Ready" subtitle="Protected by RoleRoute and BranchContext">
        <p className="text-sm text-slate-600">
          API and table bindings for <strong>AI Wound Triage Queue</strong> will connect directly to{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/api/v1</code>.
        </p>
      </Card>
    </div>
  );
}

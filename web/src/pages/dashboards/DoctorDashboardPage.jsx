import { useNavigate } from 'react-router-dom';
import { Stethoscope, ClipboardCheck, ShieldAlert, Syringe, HeartPulse, AlertTriangle, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import {
  useSupabaseQuery,
  scopeToBranch,
  todayIso,
  one,
} from '../../hooks/useSupabaseQuery';
import {
  DashboardHero,
  KpiCard,
  Panel,
  TableWrap,
  Th,
  Td,
  EmptyState,
  ActionLink,
  StatusPill,
} from '../../components/dashboard/DashboardWidgets';

const WORKSPACE_CARDS = [
  {
    icon: ClipboardCheck,
    title: '1. WHO Exposure Category',
    text: 'Review nurse triage findings and classify the exposure as Category I, II, or III.',
  },
  {
    icon: Syringe,
    title: '2. PEP Regimen Order',
    text: 'Choose the ID, IM, or booster regimen and generate the Day 0 / 3 / 7 / 14 / 28 schedule.',
  },
  {
    icon: HeartPulse,
    title: '3. ERIG / HRIG & Tetanus',
    text: 'Indicate immunoglobulin infiltration (Category III) and the tetanus toxoid order.',
  },
];

export function DoctorDashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeBranchId, activeBranch } = useBranch();
  const today = todayIso();

  const pending = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('bite_cases')
          .select('id, created_at, animal_type, bite_site, ai_suggested_category, patients(full_name)')
          .eq('status', 'pending_triage')
          .is('doctor_validated_category', null)
          .order('created_at', { ascending: true })
          .limit(25),
        activeBranchId
      ),
    [activeBranchId]
  );

  const highRisk = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('bite_cases')
          .select('id, created_at, animal_type, bite_site, status, doctor_validated_category, ai_suggested_category, patients(full_name)')
          .or('doctor_validated_category.eq.III,ai_suggested_category.eq.III')
          .neq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10),
        activeBranchId
      ),
    [activeBranchId]
  );

  const followUps = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('pep_schedules')
          .select('id, case_id, dose_number, scheduled_date, status, bite_cases(patients(full_name))')
          .lt('scheduled_date', today)
          .eq('status', 'scheduled')
          .order('scheduled_date', { ascending: false })
          .limit(10),
        activeBranchId
      ),
    [activeBranchId, today]
  );

  const pendingRows = pending.data || [];
  const highRiskRows = highRisk.data || [];
  const followUpRows = followUps.data || [];

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Clinical Assessment"
        icon={Stethoscope}
        title={`Doctor Workspace — ${profile?.full_name || 'Physician'}`}
        subtitle="Consultation queue, WHO Category I–III evaluation, and prescription workflow."
        branchLabel={activeBranch?.name || 'Assigned Branch'}
        branchAddress={activeBranch?.address}
      >
        <ActionLink to="/clinical-orders" variant="secondary">
          <Stethoscope className="h-4 w-4" />
          <span>Clinical Orders</span>
        </ActionLink>
      </DashboardHero>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Pending Assessment" icon={UserCheck} tone="amber" value={pendingRows.length} hint="Awaiting physician category validation" loading={pending.loading} error={pending.error} />
        <KpiCard label="Open Category III Cases" icon={ShieldAlert} tone="red" value={highRiskRows.length} hint="High-risk, not yet completed" loading={highRisk.loading} error={highRisk.error} />
        <KpiCard label="Overdue Follow-Ups" icon={AlertTriangle} tone="navy" value={followUpRows.length} hint="Past-due scheduled PEP doses" loading={followUps.loading} error={followUps.error} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Consultation Queue */}
        <Panel
          title="Patients Pending Assessment"
          subtitle="Consultation queue ready for WHO Category I–III evaluation"
        >
          {pending.loading || pending.error || pendingRows.length === 0 ? (
            <EmptyState loading={pending.loading} error={pending.error} message="No patients are waiting for a physician assessment." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Patient</Th>
                  <Th>Exposure</Th>
                  <Th>Triage Cat.</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {pendingRows.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-bold">{one(row.patients)?.full_name || 'Unnamed patient'}</Td>
                    <Td>
                      {row.animal_type} • {row.bite_site}
                    </Td>
                    <Td>{row.ai_suggested_category ? `Cat ${row.ai_suggested_category}` : '—'}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => navigate(`/clinical-orders?case_id=${row.id}`)}
                        className="min-h-[40px] rounded-lg bg-[#118AB2] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                      >
                        Assess
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        {/* Prescription Workspace */}
        <Panel
          title="Clinical Review & Prescription Workspace"
          subtitle="Exposure assessment, PEP regimen, and immunoglobulin / tetanus orders"
        >
          <div className="space-y-2.5">
            {WORKSPACE_CARDS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3 rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 p-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#118AB2] text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#464B71] sm:text-sm">{title}</p>
                  <p className="mt-0.5 text-xs text-[#464B71]/75">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <ActionLink to="/clinical-orders">
              <Stethoscope className="h-4 w-4" />
              <span>Open Full Prescription Workspace</span>
            </ActionLink>
          </div>
        </Panel>
      </div>

      {/* Recent Cases & Follow-Up Alerts */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Recent High-Risk (Category III) Cases" subtitle="Open cases flagged Category III">
          {highRisk.loading || highRisk.error || highRiskRows.length === 0 ? (
            <EmptyState loading={highRisk.loading} error={highRisk.error} message="No open Category III cases." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Patient</Th>
                  <Th>Exposure</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {highRiskRows.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-bold">{one(row.patients)?.full_name || 'Unnamed patient'}</Td>
                    <Td>
                      {row.animal_type} • {row.bite_site}
                    </Td>
                    <Td>
                      <StatusPill tone={row.doctor_validated_category ? 'green' : 'amber'}>
                        {row.doctor_validated_category ? 'Validated' : 'Needs clearance'}
                      </StatusPill>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => navigate(`/clinical-orders?case_id=${row.id}`)}
                        className="min-h-[40px] rounded-lg bg-[#7CD5C7] px-3 py-1.5 text-xs font-extrabold text-[#464B71] hover:bg-[#68c7b8]"
                      >
                        Review
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        <Panel title="Follow-Up Alerts" subtitle="Patients with overdue PEP doses">
          {followUps.loading || followUps.error || followUpRows.length === 0 ? (
            <EmptyState loading={followUps.loading} error={followUps.error} message="No overdue follow-up doses." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Patient</Th>
                  <Th>Dose</Th>
                  <Th>Was Due</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {followUpRows.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-bold">{one(one(row.bite_cases)?.patients)?.full_name || 'Unnamed patient'}</Td>
                    <Td>{row.dose_number}</Td>
                    <Td className="whitespace-nowrap">
                      <StatusPill tone="red">{row.scheduled_date}</StatusPill>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      </div>
    </div>
  );
}

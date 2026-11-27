import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Syringe, Search, CalendarClock, AlertTriangle, ClipboardList, ScanLine } from 'lucide-react';
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DOSE_TONE = { completed: 'green', scheduled: 'blue', defaulted: 'red', rescheduled: 'amber' };

export function NurseDashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeBranchId, activeBranch } = useBranch();
  const today = todayIso();

  const queue = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('bite_cases')
          .select('id, created_at, animal_type, bite_site, status, patients(full_name, qr_code_hash)')
          .eq('status', 'pending_triage')
          .order('created_at', { ascending: true })
          .limit(25),
        activeBranchId
      ),
    [activeBranchId]
  );

  const dosesToday = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('pep_schedules')
          .select('id, case_id, dose_number, scheduled_date, status, bite_cases(patients(full_name))')
          .eq('scheduled_date', today)
          .order('dose_number', { ascending: true })
          .limit(50),
        activeBranchId
      ),
    [activeBranchId, today]
  );

  const missed = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('pep_schedules')
          .select('id, case_id, dose_number, scheduled_date, status, bite_cases(patients(full_name))')
          .lt('scheduled_date', today)
          .eq('status', 'scheduled')
          .order('scheduled_date', { ascending: false })
          .limit(25),
        activeBranchId
      ),
    [activeBranchId, today]
  );

  // Administration log lookup (patient QR token or case ID) — results stay in memory only
  const [lookup, setLookup] = useState('');
  const [lookupState, setLookupState] = useState({ loading: false, error: '', results: null });

  const handleLookup = async (e) => {
    e.preventDefault();
    const term = lookup.trim().replace(/[%,()]/g, '');
    if (!term) return;
    setLookupState({ loading: true, error: '', results: null });
    try {
      let query = supabase
        .from('bite_cases')
        .select(
          'id, created_at, animal_type, status, patients!inner(full_name, qr_code_hash), pep_schedules(id, dose_number, scheduled_date, status)'
        )
        .limit(10);
      query = UUID_REGEX.test(term)
        ? query.eq('id', term)
        : query.ilike('patients.qr_code_hash', `%${term}%`);
      query = scopeToBranch(query, activeBranchId);
      const { data, error } = await query;
      if (error) throw error;
      setLookupState({ loading: false, error: '', results: data || [] });
    } catch (err) {
      setLookupState({ loading: false, error: err.message || 'Lookup failed', results: null });
    }
  };

  const queueRows = queue.data || [];
  const todayRows = dosesToday.data || [];
  const missedRows = missed.data || [];
  const completedToday = todayRows.filter((d) => d.status === 'completed').length;
  const dueToday = todayRows.filter((d) => d.status !== 'completed').length;

  const patientName = (row) => one(one(row.bite_cases)?.patients)?.full_name || 'Unnamed patient';

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Intake & Vaccination"
        icon={Syringe}
        title={`Nurse Workspace — ${profile?.full_name || 'Nurse'}`}
        subtitle="Patient intake, today's PEP doses, and vaccine administration."
        branchLabel={activeBranch?.name || 'Assigned Branch'}
        branchAddress={activeBranch?.address}
      >
        <ActionLink to="/patients" variant="secondary">
          <UserPlus className="h-4 w-4" />
          <span>Walk-In Registration</span>
        </ActionLink>
        <ActionLink to="/triage">
          <ScanLine className="h-4 w-4" />
          <span>QR Check-In & Triage</span>
        </ActionLink>
      </DashboardHero>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Waiting for Triage" icon={ClipboardList} tone="amber" value={queueRows.length} hint="Cases awaiting vitals & assessment" loading={queue.loading} error={queue.error} />
        <KpiCard label="Doses Due Today" icon={CalendarClock} tone="blue" value={dueToday} hint="Scheduled, not yet administered" loading={dosesToday.loading} error={dosesToday.error} />
        <KpiCard label="Completed Today" icon={Syringe} tone="mint" value={completedToday} hint="Doses administered today" loading={dosesToday.loading} error={dosesToday.error} />
        <KpiCard label="Missed Follow-Ups" icon={AlertTriangle} tone="red" value={missedRows.length} hint="Past-due scheduled doses" loading={missed.loading} error={missed.error} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Patient Queue & Intake */}
        <Panel
          title="Patient Queue & Intake"
          subtitle="Waiting for triage / vitals (oldest first)"
          action={
            <ActionLink to="/triage" variant="secondary">
              Open Queue
            </ActionLink>
          }
        >
          {queue.loading || queue.error || queueRows.length === 0 ? (
            <EmptyState loading={queue.loading} error={queue.error} message="No patients are waiting for triage right now." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Patient</Th>
                  <Th>Exposure</Th>
                  <Th>Arrived</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {queueRows.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-bold">{one(row.patients)?.full_name || 'Unnamed patient'}</Td>
                    <Td>
                      {row.animal_type} • {row.bite_site}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {new Date(row.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => navigate('/triage')}
                        className="min-h-[40px] rounded-lg bg-[#118AB2] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#0D6E8E]"
                      >
                        Start Triage
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        {/* Today's Scheduled Doses */}
        <Panel title="Today's Scheduled Doses" subtitle="PEP Day 0 / 3 / 7 / 14 / 28 due or completed today">
          {dosesToday.loading || dosesToday.error || todayRows.length === 0 ? (
            <EmptyState loading={dosesToday.loading} error={dosesToday.error} message="No PEP doses are scheduled for today." />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Patient</Th>
                  <Th>Dose</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {todayRows.map((row) => (
                  <tr key={row.id}>
                    <Td className="font-bold">{patientName(row)}</Td>
                    <Td>{row.dose_number}</Td>
                    <Td>
                      <StatusPill tone={DOSE_TONE[row.status] || 'navy'}>{row.status}</StatusPill>
                    </Td>
                    <Td>
                      {row.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/clinical-orders?case_id=${row.case_id}&tab=vaccinate`)}
                          className="min-h-[40px] rounded-lg bg-[#7CD5C7] px-3 py-1.5 text-xs font-extrabold text-[#464B71] hover:bg-[#68c7b8]"
                        >
                          Administer
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}

          {missedRows.length > 0 && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-extrabold text-red-800">Missed follow-ups ({missedRows.length})</p>
              <ul className="mt-1.5 space-y-1 text-xs text-red-900">
                {missedRows.slice(0, 5).map((row) => (
                  <li key={row.id}>
                    {patientName(row)} — {row.dose_number} (was due {row.scheduled_date})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>

      {/* Vaccination & Administration Log lookup */}
      <Panel
        title="Vaccination & Administration Log"
        subtitle="Look up a patient by QR token or a case ID, then record vaccine / ERIG / tetanus doses"
      >
        <form onSubmit={handleLookup} className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#464B71]/50" />
            <input
              type="text"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="Patient QR token (e.g. VABC-…) or case ID"
              aria-label="Patient QR token or case ID"
              className="min-h-[44px] w-full rounded-xl border border-[#DDDCD4] bg-[#F2F2ED]/60 py-2 pl-10 pr-3 text-sm font-semibold text-[#464B71] focus:border-[#118AB2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#118AB2]/20"
            />
          </div>
          <button
            type="submit"
            disabled={lookupState.loading}
            className="min-h-[44px] rounded-xl bg-[#118AB2] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#0D6E8E] disabled:opacity-60"
          >
            {lookupState.loading ? 'Searching…' : 'Look Up'}
          </button>
        </form>

        {lookupState.error && (
          <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
            {lookupState.error}
          </p>
        )}

        {lookupState.results && (
          <div className="mt-3">
            {lookupState.results.length === 0 ? (
              <EmptyState message="No matching case found in this branch scope." />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Patient</Th>
                    <Th>Exposure</Th>
                    <Th>Doses</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2ED]">
                  {lookupState.results.map((c) => (
                    <tr key={c.id}>
                      <Td className="font-bold">{one(c.patients)?.full_name}</Td>
                      <Td>
                        {c.animal_type} • <span className="capitalize">{c.status.replace('_', ' ')}</span>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {(c.pep_schedules || []).map((s) => (
                            <StatusPill key={s.id} tone={DOSE_TONE[s.status] || 'navy'}>
                              {s.dose_number}
                            </StatusPill>
                          ))}
                        </div>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => navigate(`/clinical-orders?case_id=${c.id}&tab=vaccinate`)}
                          className="min-h-[40px] rounded-lg bg-[#7CD5C7] px-3 py-1.5 text-xs font-extrabold text-[#464B71] hover:bg-[#68c7b8]"
                        >
                          Record Dose
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

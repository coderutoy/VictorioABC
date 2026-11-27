import { Link } from 'react-router-dom';
import { Users, Activity, PackageX, UserCheck, Building2, ClipboardList, Syringe, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import {
  useSupabaseQuery,
  scopeToBranch,
  startOfTodayIso,
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

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function AdminDashboardPage() {
  const { profile } = useAuth();
  const { activeBranchId, activeBranch } = useBranch();

  const todayPatients = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('bite_cases')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfTodayIso()),
        activeBranchId
      ),
    [activeBranchId]
  );

  const activePep = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('bite_cases')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending_triage', 'validated']),
        activeBranchId
      ),
    [activeBranchId]
  );

  const inventory = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('vaccine_inventory')
          .select('id, item_type, vaccine_name, batch_number, quantity_remaining, low_stock_threshold, expiration_date')
          .order('expiration_date', { ascending: true })
          .limit(200),
        activeBranchId
      ),
    [activeBranchId]
  );

  const staff = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('profiles')
          .select('id, full_name, role, email, is_active')
          .in('role', ['doctor', 'nurse'])
          .order('role', { ascending: true })
          .limit(100),
        activeBranchId
      ),
    [activeBranchId]
  );

  const audit = useSupabaseQuery(
    () =>
      scopeToBranch(
        supabase
          .from('audit_logs')
          .select('id, action, entity_type, created_at')
          .order('created_at', { ascending: false })
          .limit(10),
        activeBranchId
      ),
    [activeBranchId]
  );

  const inventoryRows = inventory.data || [];
  const lowStock = inventoryRows.filter(
    (row) => Number(row.quantity_remaining) <= Number(row.low_stock_threshold)
  );
  const staffRows = staff.data || [];
  const activeStaff = staffRows.filter((s) => s.is_active !== false);

  return (
    <div className="space-y-5">
      <DashboardHero
        eyebrow="Branch Administration"
        icon={Building2}
        title={`Welcome, ${profile?.full_name || 'Administrator'}`}
        subtitle="Branch overview, staff, vaccine and ERIG stock, and audit activity."
        branchLabel={activeBranch?.name || 'All Branches (HQ View)'}
        branchAddress={activeBranch?.address}
      >
        <ActionLink to="/analytics" variant="secondary">
          HQ Analytics
        </ActionLink>
        <ActionLink to="/branches">Manage Branches</ActionLink>
      </DashboardHero>

      {/* Branch Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today's Patients"
          icon={Users}
          tone="blue"
          value={todayPatients.count ?? 0}
          hint="New bite cases registered today"
          loading={todayPatients.loading}
          error={todayPatients.error}
        />
        <KpiCard
          label="Active PEP Cases"
          icon={Activity}
          tone="mint"
          value={activePep.count ?? 0}
          hint="Pending triage or validated, not yet completed"
          loading={activePep.loading}
          error={activePep.error}
        />
        <KpiCard
          label="Low-Stock Vaccines"
          icon={PackageX}
          tone="amber"
          value={lowStock.length}
          hint="Batches at or below their low-stock threshold"
          loading={inventory.loading}
          error={inventory.error}
        />
        <KpiCard
          label="Active Clinical Staff"
          icon={UserCheck}
          tone="navy"
          value={activeStaff.length}
          hint="Active doctors & nurses assigned in scope"
          loading={staff.loading}
          error={staff.error}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Staff & Role Management */}
        <Panel
          title="Staff & Role Management"
          subtitle="Doctors and nurses assigned to this branch scope"
          action={<StatusPill tone="blue">{staffRows.length} on record</StatusPill>}
        >
          {staff.loading || staff.error || staffRows.length === 0 ? (
            <EmptyState
              loading={staff.loading}
              error={staff.error}
              message="No doctors or nurses are assigned to this branch scope yet."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Role</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {staffRows.map((s) => (
                  <tr key={s.id}>
                    <Td className="font-bold">{s.full_name}</Td>
                    <Td className="capitalize">{s.role}</Td>
                    <Td>{s.email || '—'}</Td>
                    <Td>
                      <StatusPill tone={s.is_active === false ? 'red' : 'green'}>
                        {s.is_active === false ? 'Inactive' : 'Active'}
                      </StatusPill>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
          <p className="mt-3 text-[11px] text-[#464B71]/65">
            Account creation and role changes are performed by Central Admin through Supabase Auth.
          </p>
        </Panel>

        {/* Branch Activity & Audit Log */}
        <Panel
          title="Branch Activity & Audit Log"
          subtitle="Latest 10 recorded actions"
          action={
            <Link to="/audit" className="text-xs font-extrabold text-[#118AB2] hover:underline">
              Full audit log &rarr;
            </Link>
          }
        >
          {audit.loading || audit.error || (audit.data || []).length === 0 ? (
            <EmptyState
              loading={audit.loading}
              error={audit.error}
              message="No audit activity recorded for this scope yet."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Action</Th>
                  <Th>Entity</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2ED]">
                {audit.data.map((row) => (
                  <tr key={row.id}>
                    <Td className="whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Td>
                    <Td className="font-bold">{row.action}</Td>
                    <Td>{row.entity_type}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      </div>

      {/* Vaccine & ERIG Inventory Overview */}
      <Panel
        title="Vaccine & ERIG Inventory Overview"
        subtitle="Stock levels and expiry watch (earliest expiry first)"
        action={
          <ActionLink to="/inventory" variant="secondary">
            <Syringe className="h-4 w-4" />
            <span>Open Inventory</span>
          </ActionLink>
        }
      >
        {inventory.loading || inventory.error || inventoryRows.length === 0 ? (
          <EmptyState
            loading={inventory.loading}
            error={inventory.error}
            message="No vaccine, ERIG, or tetanus stock recorded for this branch scope yet."
          />
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Item</Th>
                <Th>Type</Th>
                <Th>Batch</Th>
                <Th>Qty</Th>
                <Th>Expiry</Th>
                <Th>Flag</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2ED]">
              {inventoryRows.slice(0, 15).map((row) => {
                const days = daysUntil(row.expiration_date);
                const isLow = Number(row.quantity_remaining) <= Number(row.low_stock_threshold);
                const expiring = days !== null && days <= 90;
                return (
                  <tr key={row.id}>
                    <Td className="font-bold">{row.vaccine_name}</Td>
                    <Td className="uppercase">{row.item_type.replace('_', ' ')}</Td>
                    <Td>{row.batch_number}</Td>
                    <Td className="font-bold">{row.quantity_remaining}</Td>
                    <Td className="whitespace-nowrap">{row.expiration_date}</Td>
                    <Td>
                      {days !== null && days < 0 ? (
                        <StatusPill tone="red">Expired</StatusPill>
                      ) : isLow ? (
                        <StatusPill tone="amber">Low stock</StatusPill>
                      ) : expiring ? (
                        <StatusPill tone="amber">Expires in {days}d</StatusPill>
                      ) : (
                        <StatusPill tone="green">OK</StatusPill>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <p className="flex items-center gap-1.5 text-[11px] text-[#464B71]/60">
        <ShieldCheck className="h-3.5 w-3.5" />
        <ClipboardList className="h-3.5 w-3.5" />
        Counts come live from Supabase under your role&rsquo;s Row-Level Security; empty cards mean no records yet.
      </p>
    </div>
  );
}

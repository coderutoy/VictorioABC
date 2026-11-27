import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Database } from 'lucide-react';

export function LiveClock({ className = '' }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5" />
        {now.toLocaleDateString('en-PH', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </span>
  );
}

export function DashboardHero({ eyebrow, title, subtitle, branchLabel, branchAddress, icon: Icon, children }) {
  return (
    <div className="rounded-3xl bg-[#464B71] p-5 text-white shadow-md sm:p-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#7CD5C7]">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span>{eyebrow}</span>
          </span>
          <h1 className="text-xl font-extrabold sm:text-3xl">{title}</h1>
          {subtitle && <p className="max-w-2xl text-xs text-white/85 sm:text-sm">{subtitle}</p>}
          <div className="flex flex-col gap-1 text-xs text-white/85">
            <span className="inline-flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7CD5C7]" />
              <span className="min-w-0">
                <strong className="text-white">{branchLabel}</strong>
                {branchAddress ? ` • ${branchAddress}` : ''}
              </span>
            </span>
            <LiveClock className="text-[#7CD5C7]" />
          </div>
        </div>
        {children && <div className="flex flex-wrap gap-2.5">{children}</div>}
      </div>
    </div>
  );
}

const KPI_TONES = {
  blue: 'bg-[#118AB2]/10 text-[#118AB2]',
  mint: 'bg-[#7CD5C7]/35 text-[#1E6B60]',
  amber: 'bg-amber-100 text-amber-700',
  navy: 'bg-[#464B71]/10 text-[#464B71]',
  red: 'bg-red-100 text-red-700',
};

export function KpiCard({ label, value, hint, icon: Icon, tone = 'blue', loading, error }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#DDDCD4] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-extrabold text-[#464B71]/80">{label}</p>
        {Icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${KPI_TONES[tone]}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-extrabold text-[#464B71]">
        {loading ? '…' : error ? '0' : value}
      </p>
      <p className="mt-1 text-[11px] text-[#464B71]/70">
        {error ? 'Data source pending — showing 0' : hint}
      </p>
    </div>
  );
}

export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-[#DDDCD4] bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold text-[#464B71] sm:text-base">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[#464B71]/70">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Wide tables scroll inside their own card instead of the whole page. */
export function TableWrap({ children }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="min-w-full divide-y divide-[#DDDCD4] text-left text-xs sm:text-sm">
        {children}
      </table>
    </div>
  );
}

export function Th({ children }) {
  return (
    <th className="whitespace-nowrap bg-[#F2F2ED] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-[#464B71]/80">
      {children}
    </th>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`px-3 py-2.5 align-top text-[#464B71] ${className}`}>{children}</td>;
}

/** Honest empty / schema-pending state — never fabricated rows. */
export function EmptyState({ message, error, loading }) {
  if (loading) {
    return <p className="rounded-xl bg-[#F2F2ED]/70 px-4 py-6 text-center text-xs text-[#464B71]/70">Loading…</p>;
  }
  return (
    <div className="rounded-xl border border-dashed border-[#DDDCD4] bg-[#F2F2ED]/50 px-4 py-6 text-center">
      <p className="text-xs font-bold text-[#464B71]/80">{message}</p>
      {error && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#464B71]/60">
          <Database className="h-3 w-3" />
          <span className="break-all">Data source not ready: {error}</span>
        </p>
      )}
    </div>
  );
}

export function ActionLink({ to, children, variant = 'primary' }) {
  const styles =
    variant === 'primary'
      ? 'bg-[#118AB2] text-white hover:bg-[#0D6E8E]'
      : 'bg-[#7CD5C7] text-[#464B71] hover:bg-[#68c7b8]';
  return (
    <Link
      to={to}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition ${styles}`}
    >
      {children}
    </Link>
  );
}

export function StatusPill({ children, tone = 'navy' }) {
  const tones = {
    navy: 'bg-[#464B71]/10 text-[#464B71]',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-[#118AB2]/15 text-[#0D6E8E]',
  };
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${tones[tone]}`}>
      {children}
    </span>
  );
}

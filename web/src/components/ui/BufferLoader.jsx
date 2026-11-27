import { ShieldCheck, Activity } from 'lucide-react';

/**
 * Branded clinical BufferLoader overlay for login, logout, session hydration,
 * and dashboard module transitions (~500–650ms smooth visual transition).
 */
export function BufferLoader({
  message = 'Loading clinical workspace...',
  submessage = 'Victorio Animal Bite Center • Encrypted Clinical Session',
  fullScreen = true,
  isDark = false,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="buffer-loader"
      className={`${
        fullScreen ? 'fixed inset-0 z-50' : 'relative min-h-[340px] w-full rounded-3xl'
      } flex flex-col items-center justify-center px-4 transition-opacity duration-300 ${
        isDark
          ? 'bg-[#0F172A]/95 text-slate-100 backdrop-blur-md'
          : 'bg-[#464B71]/95 text-white backdrop-blur-md'
      }`}
    >
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#7CD5C7]/30" />
          <span className="absolute inset-1.5 animate-pulse rounded-full border-2 border-[#7CD5C7]/60" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#7CD5C7] bg-white p-1 shadow-xl">
            <img
              src="/victorio_logo.jpg"
              alt="Victorio ABC"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#7CD5C7] ring-1 ring-[#7CD5C7]/30">
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          <span>Clinical System Buffer</span>
        </div>

        <p className="mt-3 text-lg font-extrabold tracking-tight text-white sm:text-xl">
          {message}
        </p>
        <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-white/75">
          <ShieldCheck className="h-3.5 w-3.5 text-[#7CD5C7]" />
          <span>{submessage}</span>
        </p>

        <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-[#118AB2] via-[#7CD5C7] to-[#118AB2]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton loaders for KPI strips, tables, and operational cards during /api/v1/* fetches.
 */
export function KpiStripSkeleton({ count = 5, isDark = false }) {
  return (
    <div
      data-testid="kpi-strip-skeleton"
      className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`animate-pulse rounded-2xl border p-4 ${
            isDark
              ? 'border-slate-700/80 bg-[#1E293B]'
              : 'border-[#DDDCD4] bg-white'
          }`}
        >
          <div
            className={`h-3 w-24 rounded ${
              isDark ? 'bg-slate-700' : 'bg-[#E5E4DC]'
            }`}
          />
          <div
            className={`mt-3 h-7 w-32 rounded-lg ${
              isDark ? 'bg-slate-700' : 'bg-[#E5E4DC]'
            }`}
          />
          <div
            className={`mt-3 h-2.5 w-40 rounded ${
              isDark ? 'bg-slate-800' : 'bg-[#F2F2ED]'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, isDark = false }) {
  return (
    <div
      data-testid="table-skeleton"
      className={`animate-pulse rounded-2xl border p-5 ${
        isDark
          ? 'border-slate-700/80 bg-[#1E293B]'
          : 'border-[#DDDCD4] bg-white'
      }`}
    >
      <div
        className={`h-5 w-56 rounded ${
          isDark ? 'bg-slate-700' : 'bg-[#E5E4DC]'
        }`}
      />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className={`h-12 w-full rounded-xl ${
              isDark ? 'bg-slate-800/90' : 'bg-[#F2F2ED]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceSkeleton({ isDark = false }) {
  return (
    <div className="space-y-5">
      <KpiStripSkeleton count={5} isDark={isDark} />
      <TableSkeleton rows={6} isDark={isDark} />
    </div>
  );
}

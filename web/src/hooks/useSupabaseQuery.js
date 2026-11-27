import { useEffect, useRef, useState } from 'react';

/**
 * Small data hook for dashboard widgets. `queryFn` returns a Supabase builder result
 * ({ data, count, error }). Errors (e.g. tables not migrated yet) are surfaced as `error`
 * so widgets can render an honest "schema pending" empty state instead of fake data.
 * Results live in React memory only — nothing is written to localStorage/cookies (RA 10173).
 */
export function useSupabaseQuery(queryFn, deps = []) {
  const [state, setState] = useState({ data: null, count: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(queryFn);
  fnRef.current = queryFn;

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true }));

    (async () => {
      try {
        const res = await fnRef.current();
        if (!active) return;
        setState({
          data: res?.data ?? null,
          count: res?.count ?? null,
          error: res?.error ? res.error.message || 'Query failed' : null,
          loading: false,
        });
      } catch (err) {
        if (!active) return;
        setState({ data: null, count: null, error: err?.message || 'Query failed', loading: false });
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, refetch: () => setTick((t) => t + 1) };
}

/** Restricts a Supabase query builder to a branch when one is selected. */
export function scopeToBranch(query, branchId, column = 'branch_id') {
  return branchId ? query.eq(column, branchId) : query;
}

export function todayIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Supabase returns embedded to-one relations as an object (or a single-item array). */
export function one(value) {
  return Array.isArray(value) ? value[0] : value;
}

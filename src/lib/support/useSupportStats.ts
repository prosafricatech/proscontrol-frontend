'use client';

import { useCallback, useEffect, useState } from 'react';

export type SupportStats = {
  total: number;
  new: number;
  active: number;
  closed: number;
  unassigned: number;
  mine: number;
  /** created_at of tickets from roughly the last week, for per-day charts. */
  recentCreatedAt: string[];
};

const EMPTY_STATS: SupportStats = { total: 0, new: 0, active: 0, closed: 0, unassigned: 0, mine: 0, recentCreatedAt: [] };

export function useSupportStats() {
  const [stats, setStats] = useState<SupportStats>(EMPTY_STATS);

  const reload = useCallback(async () => {
    try {
      const response = await fetch('/api/support/stats', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.data) setStats({ ...EMPTY_STATS, ...payload.data });
    } catch {
      // Keep the last known numbers; the page still works without them.
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { stats, reload };
}

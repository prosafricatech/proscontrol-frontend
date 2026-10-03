'use client';

import { useT } from '@/lib/i18n/useT';
import type {
  ActivityActorType,
  ActivityCategory,
  ActivityEntry,
} from '@/lib/support/types';
import type { TicketPageMeta } from '@/lib/support/usePaginatedTickets';
import { useEffect, useState } from 'react';

const EMPTY_META: TicketPageMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

export type ActivityLogFilters = {
  category: ActivityCategory;
  /** '' for every action in the category. */
  action: string;
  /** '' for staff and customers alike. */
  actorType: ActivityActorType | '';
  search: string;
  /** Local calendar days as YYYY-MM-DD, or ''. */
  from: string;
  to: string;
};

/** A local YYYY-MM-DD day as the ISO instant it starts or ends at. */
function dayBoundary(day: string, edge: 'start' | 'end'): string {
  const time = edge === 'start' ? '00:00:00.000' : '23:59:59.999';

  return new Date(`${day}T${time}`).toISOString();
}

function toQuery(filters: ActivityLogFilters, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    category: filters.category,
  });

  if (filters.action) {
    params.set('action', filters.action);
  }
  if (filters.actorType) {
    params.set('actor_type', filters.actorType);
  }
  if (filters.search.trim()) {
    params.set('search', filters.search.trim());
  }
  if (filters.from) {
    params.set('from', dayBoundary(filters.from, 'start'));
  }
  if (filters.to) {
    params.set('to', dayBoundary(filters.to, 'end'));
  }

  return params.toString();
}

/** One page of the audit log for the given filters. */
export function useActivityLog(filters: ActivityLogFilters, page: number) {
  const t = useT();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [meta, setMeta] = useState<TicketPageMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // A string, so the effect only re-runs when a filter value really changes.
  const query = toQuery(filters, page);

  useEffect(() => {
    let cancelled = false;
    const loadFailed = t(
      'portal.activity.loadFailed',
      'Unable to load the activity log.'
    );

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/support/activity-logs?${query}`, {
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;

        if (!response.ok) {
          setError(payload?.message || loadFailed);
          setEntries([]);
          return;
        }
        setEntries(Array.isArray(payload?.data) ? payload.data : []);
        setMeta(payload?.meta ?? EMPTY_META);
      } catch {
        if (!cancelled) {
          setError(loadFailed);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [query, t]);

  return { entries, meta, loading, error };
}

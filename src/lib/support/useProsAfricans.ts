'use client';

import type { ProsAfrican } from '@/lib/support/types';
import type { TicketPageMeta } from '@/lib/support/usePaginatedTickets';
import { useEffect, useState } from 'react';

// Wait for a pause in typing before asking prosERP (through our backend).
const SEARCH_DEBOUNCE_MS = 300;

const EMPTY_META: TicketPageMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

/**
 * One page of ProsAfricans (prosERP's team) matching `keyword` (name or
 * email), searched on the server. Only fetches while `enabled` (e.g. the
 * "Assign to" picker is open).
 */
export function useProsAfricans(keyword: string, enabled = true, page = 1) {
  const [people, setPeople] = useState<ProsAfrican[]>([]);
  const [meta, setMeta] = useState<TicketPageMeta>(EMPTY_META);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (keyword.trim()) {
        params.set('keyword', keyword.trim());
      }

      try {
        const response = await fetch(`/api/support/prosafricans?${params}`, {
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;

        if (!response.ok) {
          setError(payload?.message ?? null);
          setPeople([]);
          return;
        }
        setError(null);
        setPeople(Array.isArray(payload?.data) ? payload.data : []);
        setMeta(payload?.meta ?? EMPTY_META);
      } catch {
        if (!cancelled) {
          setError(null);
          setPeople([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keyword, enabled, page]);

  return { people, meta, loading, error };
}

export type EnrollResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/**
 * The ProsControl user id to assign the ticket to. Someone who has never
 * signed in to ProsControl gets an account created by the backend first.
 */
export async function resolveAssigneeUserId(
  person: ProsAfrican,
  fallbackError: string
): Promise<EnrollResult> {
  if (person.userId) {
    return { ok: true, userId: person.userId };
  }

  try {
    const response = await fetch(
      `/api/support/prosafricans/${person.proserpUserId}/enroll`,
      { method: 'POST' }
    );
    const payload = await response.json().catch(() => null);
    const userId = payload?.data?.userId;

    return response.ok && userId
      ? { ok: true, userId }
      : { ok: false, error: payload?.message || fallbackError };
  } catch {
    return { ok: false, error: fallbackError };
  }
}

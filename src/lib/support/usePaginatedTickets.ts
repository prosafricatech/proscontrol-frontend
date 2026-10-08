'use client';

import { useRealtimeEvent } from '@/lib/realtime/RealtimeProvider';
import type { Ticket } from '@/lib/support/types';
import { useCallback, useEffect, useState } from 'react';

export type TicketPageMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

const EMPTY_META: TicketPageMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
};

/**
 * One page of tickets from a list endpoint (`/api/support/tickets` or `/mine`).
 * Changing `query` (e.g. the status filter) goes back to page 1. The page
 * reloads quietly when a ticket changes over the WebSocket.
 */
export function usePaginatedTickets(
  endpoint: string,
  query: Record<string, string | undefined> = {}
) {
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<TicketPageMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    setPage(1);
  }, [queryKey]);

  /** `quiet` keeps the current rows on screen instead of showing a loader. */
  const load = useCallback(
    async (quiet = false) => {
      const params = new URLSearchParams();
      Object.entries(
        JSON.parse(queryKey) as Record<string, string | undefined>
      ).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set('page', String(page));

      if (!quiet) {
        setLoading(true);
      }
      try {
        const response = await fetch(`${endpoint}?${params}`, {
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          setError(payload?.message || 'Unable to load tickets.');
          setTickets([]);
          setMeta(EMPTY_META);
          return;
        }
        setError(null);
        setTickets(Array.isArray(payload?.data) ? payload.data : []);
        setMeta(payload?.meta ?? EMPTY_META);
      } catch {
        setError('Unable to load tickets.');
      } finally {
        setLoading(false);
      }
    },
    [endpoint, queryKey, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  // A ticket's status or assignee changed, or a ticket notification arrived
  // (e.g. a new ticket for staff): the list may be out of date.
  useRealtimeEvent('ticket.updated', () => {
    load(true);
  });
  useRealtimeEvent('notification.created', (payload) => {
    if (String(payload?.type ?? '').startsWith('ticket.')) {
      load(true);
    }
  });
  useRealtimeEvent('reconnected', () => {
    load(true);
  });

  return {
    tickets,
    meta,
    page,
    setPage,
    loading,
    error,
    reload: () => load(),
  };
}

'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { isPollingFallbackEnabled } from '@/lib/realtime/echo';
import { useRealtime, useRealtimeEvent } from '@/lib/realtime/RealtimeProvider';
import { normalizeNotification } from '@/lib/support/normalize';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SupportNotification } from './types';

type NotificationsContextValue = {
  /** Loaded notifications, newest first (page 1, plus any pages loaded with loadMore). */
  items: SupportNotification[];
  unreadCount: number;
  /** Total notifications on the server (not just the loaded pages). */
  total: number;
  loading: boolean;
  hasMore: boolean;
  /** Reload the first page (e.g. when the bell opens). */
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Mark every unread notification about this ticket as read (the user is viewing it). */
  markTicketRead: (ticketId: string) => void;
};

// Fallback while the WebSocket is down: only the unread count is polled, and
// the list is reloaded when the count changes.
const UNREAD_POLL_INTERVAL_MS = 30000;

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

type PagePayload = {
  data?: SupportNotification[];
  meta?: { current_page: number; last_page: number; total: number };
};

async function fetchPage(page: number): Promise<PagePayload | null> {
  const response = await fetch(`/api/support/notifications?page=${page}`, {
    cache: 'no-store',
  });
  return response.ok ? response.json() : null;
}

async function fetchUnreadCount(): Promise<number | null> {
  const response = await fetch('/api/support/notifications/unread-count', {
    cache: 'no-store',
  });
  if (!response.ok) return null;

  const payload = await response.json().catch(() => null);
  return typeof payload?.data?.count === 'number' ? payload.data.count : null;
}

/**
 * The signed-in user's notifications, from the backend notifications API.
 * One provider for the whole support portal, so every page's bell shares it.
 *
 * First load is REST. After that, new notifications arrive live over the
 * WebSocket (`notification.created`); polling runs only while it's down.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { authData } = useJumboAuth();
  const userId = authData?.authUser?.user?.id
    ? String(authData.authUser.user.id)
    : '';

  const [items, setItems] = useState<SupportNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const lastSeenUnreadCount = useRef<number | null>(null);
  const { connected } = useRealtime();

  const refresh = useCallback(async () => {
    if (!userId) return;

    try {
      const [firstPage, count] = await Promise.all([
        fetchPage(1),
        fetchUnreadCount(),
      ]);
      if (firstPage?.data) {
        setItems(firstPage.data);
        setPage(1);
        setLastPage(firstPage.meta?.last_page ?? 1);
        setTotal(firstPage.meta?.total ?? firstPage.data.length);
      }
      if (count !== null) {
        setUnreadCount(count);
        lastSeenUnreadCount.current = count;
      }
    } catch {
      // Keep what we have; the next poll retries.
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (page >= lastPage) return;

    const nextPage = await fetchPage(page + 1).catch(() => null);
    if (!nextPage?.data) return;

    setItems((current) => {
      const knownIds = new Set(current.map((item) => item.id));
      return [
        ...current,
        ...nextPage.data!.filter((item) => !knownIds.has(item.id)),
      ];
    });
    setPage(page + 1);
    setLastPage(nextPage.meta?.last_page ?? lastPage);
  }, [page, lastPage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Fallback polling, only while the WebSocket is down: check the cheap
  // unread count and reload the list only when it changed.
  useEffect(() => {
    if (!userId || connected || !isPollingFallbackEnabled) return;

    const checkForNew = async () => {
      if (document.visibilityState !== 'visible') return;

      const count = await fetchUnreadCount().catch(() => null);
      if (count !== null && count !== lastSeenUnreadCount.current) {
        refresh();
      }
    };

    const interval = window.setInterval(checkForNew, UNREAD_POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', checkForNew);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', checkForNew);
    };
  }, [userId, connected, refresh]);

  // Latest items for callbacks that must not re-create on every change.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // A new notification over the WebSocket: add it to the top of the list and
  // count it. The unread count is never in the payload, so it's kept locally
  // and reconciled with the server on reconnect.
  useRealtimeEvent('notification.created', (payload) => {
    const notification = normalizeNotification(payload);
    if (itemsRef.current.some((item) => item.id === notification.id)) {
      return;
    }

    setItems((current) => [notification, ...current]);
    setTotal((current) => current + 1);
    if (!notification.readAt) {
      setUnreadCount((current) => current + 1);
    }
  });

  // Back online after a drop: fetch whatever arrived in between.
  useRealtimeEvent('reconnected', () => {
    refresh();
  });

  const markRead = useCallback((id: string) => {
    const target = itemsRef.current.find((item) => item.id === id);
    if (!target || target.readAt) return;

    const now = new Date().toISOString();
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, readAt: now } : item))
    );

    // Update the badge right away; the server call makes it permanent.
    setUnreadCount((count) => Math.max(0, count - 1));
    lastSeenUnreadCount.current = Math.max(
      0,
      (lastSeenUnreadCount.current ?? 1) - 1
    );
    fetch(`/api/support/notifications/${id}/read`, { method: 'PATCH' }).catch(
      () => undefined
    );
  }, []);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setItems((current) =>
      current.map((item) => (item.readAt ? item : { ...item, readAt: now }))
    );
    setUnreadCount(0);
    lastSeenUnreadCount.current = 0;
    fetch('/api/support/notifications/read-all', { method: 'PATCH' }).catch(
      () => undefined
    );
  }, []);

  const markTicketRead = useCallback(
    (ticketId: string) => {
      itemsRef.current
        .filter((item) => item.ticketId === ticketId && !item.readAt)
        .forEach((item) => markRead(item.id));
    },
    [markRead]
  );

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      total,
      loading,
      hasMore: page < lastPage,
      refresh,
      loadMore,
      markRead,
      markAllRead,
      markTicketRead,
    }),
    [
      items,
      unreadCount,
      total,
      loading,
      page,
      lastPage,
      refresh,
      loadMore,
      markRead,
      markAllRead,
      markTicketRead,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useSupportNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      'useSupportNotifications must be used inside NotificationsProvider'
    );
  }
  return context;
}

/**
 * While a ticket is open, mark its notifications read (including ones that
 * arrive while the user is looking at the conversation).
 */
export function useMarkTicketNotificationsRead(ticketId: string | undefined) {
  const { items, markTicketRead } = useSupportNotifications();
  const hasUnreadForTicket =
    !!ticketId &&
    items.some((item) => item.ticketId === ticketId && !item.readAt);

  useEffect(() => {
    if (ticketId && hasUnreadForTicket) {
      markTicketRead(ticketId);
    }
  }, [ticketId, hasUnreadForTicket, markTicketRead]);
}

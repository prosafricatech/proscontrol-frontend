'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

export type SupportNotification = {
  id: string;
  kind: 'new_ticket' | 'assigned' | 'activated' | 'closed' | 'messages';
  actorName: string | null;
  count: string | null;
  subject: string;
  at: string;
  ticketId: string;
};

type NotificationsContextValue = {
  items: (SupportNotification & { unread: boolean })[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

// Derived notifications are cheap to miss for a minute; see the API route for cost.
const POLL_INTERVAL_MS = 60000;
// "Read" state lives in the browser until the backend has a notifications table.
const SEEN_STORAGE_PREFIX = 'pc-notifications-seen:';
const MAX_SEEN = 500;

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function loadSeen(key: string): string[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveSeen(key: string, seen: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(seen.slice(-MAX_SEEN)));
  } catch {
    // Storage unavailable: read state just won't survive a reload.
  }
}

/**
 * One notifications poller for the whole support portal, so every page's bell
 * shares the same data instead of each page fetching its own.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { authData } = useJumboAuth();
  const userId = authData?.authUser?.user?.id ? String(authData.authUser.user.id) : '';
  const seenKey = `${SEEN_STORAGE_PREFIX}${userId}`;

  const [rawItems, setRawItems] = useState<SupportNotification[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  useEffect(() => {
    if (userId) setSeen(loadSeen(seenKey));
  }, [userId, seenKey]);

  const refresh = useCallback(async () => {
    if (!userId || inFlight.current) return;
    inFlight.current = true;
    try {
      const response = await fetch('/api/support/notifications', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (response.ok && Array.isArray(payload?.data?.items)) setRawItems(payload.data.items);
    } catch {
      // Keep the last list; the next poll will retry.
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    refresh();

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [userId, refresh]);

  const markRead = useCallback((id: string) => {
    setSeen((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      saveSeen(seenKey, next);
      return next;
    });
  }, [seenKey]);

  const markAllRead = useCallback(() => {
    setSeen((current) => {
      const next = Array.from(new Set([...current, ...rawItems.map((item) => item.id)]));
      saveSeen(seenKey, next);
      return next;
    });
  }, [rawItems, seenKey]);

  const value = useMemo(() => {
    const seenSet = new Set(seen);
    const items = rawItems.map((item) => ({ ...item, unread: !seenSet.has(item.id) }));
    return {
      items,
      unreadCount: items.filter((item) => item.unread).length,
      loading,
      refresh,
      markRead,
      markAllRead,
    };
  }, [rawItems, seen, loading, refresh, markRead, markAllRead]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useSupportNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useSupportNotifications must be used inside NotificationsProvider');
  return context;
}

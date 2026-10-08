'use client';

import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { createEcho } from '@/lib/realtime/echo';
import {
  REALTIME_EVENTS,
  type RealtimeEventName,
  type RealtimeHandler,
} from '@/lib/realtime/events';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/** A backend event, or 'reconnected' (time to catch up over REST). */
type Topic = RealtimeEventName | 'reconnected';

type RealtimeContextValue = {
  /** True while the WebSocket is connected. Polling stays off meanwhile. */
  connected: boolean;
  subscribe: (topic: Topic, handler: RealtimeHandler) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  subscribe: () => () => undefined,
});

/**
 * One WebSocket per signed-in user, on the private channel `users.{id}`.
 * Pages subscribe to the events they care about (useRealtimeEvent) instead of
 * polling. When the socket is down, `connected` is false and the polling
 * fallbacks take over; after it comes back, 'reconnected' tells pages to
 * refetch what they may have missed.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { authData } = useJumboAuth();
  const userId = authData?.authUser?.user?.id
    ? String(authData.authUser.user.id)
    : '';
  const [connected, setConnected] = useState(false);
  const handlers = useRef(new Map<Topic, Set<RealtimeHandler>>());

  const emit = useCallback((topic: Topic, payload?: unknown) => {
    handlers.current.get(topic)?.forEach((handler) => handler(payload));
  }, []);

  const subscribe = useCallback((topic: Topic, handler: RealtimeHandler) => {
    const topicHandlers = handlers.current.get(topic) ?? new Set();
    topicHandlers.add(handler);
    handlers.current.set(topic, topicHandlers);

    return () => {
      topicHandlers.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const echo = createEcho();
    if (!echo) {
      return;
    }

    const channelName = `users.${userId}`;
    const channel = echo.private(channelName);
    REALTIME_EVENTS.forEach((event) => {
      // Custom event names need the leading dot (see the API contract).
      channel.listen(`.${event}`, (payload: unknown) => emit(event, payload));
    });

    let hasConnectedBefore = false;
    echo.connector.pusher.connection.bind(
      'state_change',
      ({ current }: { current: string }) => {
        const isConnected = current === 'connected';
        setConnected(isConnected);

        if (isConnected && hasConnectedBefore) {
          emit('reconnected');
        }
        if (isConnected) {
          hasConnectedBefore = true;
        }
      }
    );

    return () => {
      echo.leave(channelName);
      echo.disconnect();
      setConnected(false);
    };
  }, [userId, emit]);

  return (
    <RealtimeContext.Provider value={{ connected, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);

/** Runs `handler` for each `topic` event; always calls the latest handler. */
export function useRealtimeEvent(topic: Topic, handler: RealtimeHandler) {
  const { subscribe } = useRealtime();
  const latestHandler = useRef(handler);
  latestHandler.current = handler;

  useEffect(
    () => subscribe(topic, (payload) => latestHandler.current(payload)),
    [subscribe, topic]
  );
}

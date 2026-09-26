'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReassignmentEvent, Ticket, TicketMessage } from '@/lib/support/mockData';

// v1 backend has no push channel, so the thread is polled (see API contract).
// Messages are checked quickly while a conversation is lively and back off
// step by step when it goes quiet; any activity snaps back to the first step.
const MESSAGE_POLL_STEPS_MS = [5000, 10000, 15000, 30000];
// The ticket itself (status, assignee) changes rarely.
const TICKET_POLL_MS = 30000;
// Recent typing keeps polling at the fastest step instead of backing off.
const ACTIVITY_WINDOW_MS = 15000;

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Pull a readable message out of the backend envelope ({ code, message, data }).
 * For a 422, `data` holds `{ field: [messages] }` and the first one is used.
 */
function errorMessage(payload: any, fallback: string): string {
  const fieldErrors = payload?.data && typeof payload.data === 'object' ? Object.values(payload.data) : [];
  const firstFieldError = fieldErrors.flat().find((value) => typeof value === 'string');

  return (firstFieldError as string | undefined) || payload?.message || fallback;
}

function mergeMessages(existing: TicketMessage[], incoming: TicketMessage[]): TicketMessage[] {
  if (incoming.length === 0) return existing;

  const byId = new Map(existing.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));

  return Array.from(byId.values()).sort((a, b) => Number(a.id) - Number(b.id));
}

export function useTicketThread(ticketId: string | undefined, currentUserId: string, isStaff: boolean) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reassignments, setReassignments] = useState<ReassignmentEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const messagesRef = useRef<TicketMessage[]>([]);
  const markReadAttempted = useRef(new Set<string>());
  const ticketStatusRef = useRef<Ticket['status'] | null>(null);
  const lastTicketFetchAt = useRef(0);
  const pollStep = useRef(0);
  const lastActivityAt = useRef(0);
  const wakePolling = useRef<() => void>(() => undefined);

  messagesRef.current = messages;
  ticketStatusRef.current = ticket?.status ?? null;

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    lastTicketFetchAt.current = Date.now();
    const response = await fetch(`/api/support/tickets/${ticketId}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setLoadError(errorMessage(payload, 'Unable to load this ticket.'));
      return;
    }

    setLoadError(null);
    setTicket(payload?.data ?? null);
  }, [ticketId]);

  /** Returns how many new messages arrived from the other participant. */
  const fetchMessages = useCallback(async (onlyNew: boolean): Promise<number> => {
    if (!ticketId) return 0;
    const lastId = messagesRef.current.at(-1)?.id;
    const query = onlyNew && lastId ? `?after_id=${lastId}` : '';
    const response = await fetch(`/api/support/tickets/${ticketId}/messages${query}`, { cache: 'no-store' });
    if (!response.ok) return 0;

    const payload = await response.json().catch(() => null);
    const incoming: TicketMessage[] = payload?.data ?? [];
    setMessages((current) => (onlyNew ? mergeMessages(current, incoming) : mergeMessages([], incoming)));

    return incoming.filter((message) => message.senderId !== currentUserId).length;
  }, [ticketId, currentUserId]);

  const fetchReassignments = useCallback(async () => {
    if (!ticketId || !isStaff) return;
    const response = await fetch(`/api/support/tickets/${ticketId}/reassignments`, { cache: 'no-store' });
    if (!response.ok) return;

    const payload = await response.json().catch(() => null);
    setReassignments(payload?.data ?? []);
  }, [ticketId, isStaff]);

  useEffect(() => {
    if (!ticketId) return;

    fetchTicket();
    fetchMessages(false);
    fetchReassignments();

    let cancelled = false;
    let timer: number | undefined;

    const schedule = () => {
      window.clearTimeout(timer);
      const hidden = document.visibilityState !== 'visible';
      const delay = hidden ? MESSAGE_POLL_STEPS_MS.at(-1)! : MESSAGE_POLL_STEPS_MS[pollStep.current];
      timer = window.setTimeout(tick, delay);
    };

    const tick = async () => {
      if (cancelled) return;
      // Closed is final (no reopening), so nothing more can arrive.
      if (ticketStatusRef.current === 'closed') return;

      if (document.visibilityState === 'visible') {
        const newFromOthers = await fetchMessages(true).catch(() => 0);
        if (newFromOthers > 0) {
          pollStep.current = 0;
          fetchTicket();
        } else {
          if (Date.now() - lastActivityAt.current >= ACTIVITY_WINDOW_MS) {
            pollStep.current = Math.min(pollStep.current + 1, MESSAGE_POLL_STEPS_MS.length - 1);
          }
          if (Date.now() - lastTicketFetchAt.current >= TICKET_POLL_MS) await fetchTicket().catch(() => undefined);
        }
      }

      if (!cancelled) schedule();
    };

    wakePolling.current = () => {
      if (cancelled || ticketStatusRef.current === 'closed') return;
      pollStep.current = 0;
      window.clearTimeout(timer);
      tick();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') wakePolling.current();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    schedule();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wakePolling.current = () => undefined;
    };
  }, [ticketId, fetchTicket, fetchMessages, fetchReassignments]);

  /**
   * Call on user activity (typing): if polling has backed off, check right away
   * and return to the fastest interval.
   */
  const notifyActivity = useCallback(() => {
    lastActivityAt.current = Date.now();
    if (pollStep.current > 0) wakePolling.current();
  }, []);

  // Mark incoming messages read. Only the recipient may do this: the customer
  // for staff messages, the attending staff member for customer messages.
  useEffect(() => {
    if (!ticket || !currentUserId) return;

    const isRecipient = ticket.customerId === currentUserId || ticket.handledById === currentUserId;
    if (!isRecipient) return;

    const unread = messages.filter((message) =>
      message.type !== 'system'
      && !message.readAt
      && message.senderId !== currentUserId
      && !markReadAttempted.current.has(message.id));

    unread.forEach(async (message) => {
      markReadAttempted.current.add(message.id);
      const response = await fetch(`/api/support/messages/${message.id}/read`, { method: 'PATCH' });
      if (!response.ok) return;

      const payload = await response.json().catch(() => null);
      if (payload?.data) setMessages((current) => mergeMessages(current, [payload.data]));
    });
  }, [messages, ticket, currentUserId]);

  const runTicketAction = useCallback(async (
    action: string,
    init: RequestInit,
    fallbackError: string,
  ): Promise<ActionResult> => {
    if (!ticketId) return { ok: false, error: fallbackError };

    setPendingAction(action);
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/${action}`, { method: 'POST', ...init });
      const payload = await response.json().catch(() => null);

      if (!response.ok) return { ok: false, error: errorMessage(payload, fallbackError) };

      if (payload?.data) setTicket(payload.data);
      fetchReassignments();
      fetchMessages(true);

      return { ok: true };
    } catch {
      return { ok: false, error: fallbackError };
    } finally {
      setPendingAction(null);
    }
  }, [ticketId, fetchReassignments, fetchMessages]);

  const sendMessage = useCallback(async (body: string, files: File[]): Promise<ActionResult> => {
    if (!ticketId) return { ok: false, error: 'Unable to send message.' };

    const formData = new FormData();
    formData.append('body', body);
    files.forEach((file) => formData.append('attachments[]', file));

    setPendingAction('send');
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, { method: 'POST', body: formData });
      const payload = await response.json().catch(() => null);

      if (!response.ok) return { ok: false, error: errorMessage(payload, 'Unable to send message.') };

      if (payload?.data) setMessages((current) => mergeMessages(current, [payload.data]));
      pollStep.current = 0;

      return { ok: true };
    } catch {
      return { ok: false, error: 'Unable to send message.' };
    } finally {
      setPendingAction(null);
    }
  }, [ticketId]);

  const activate = useCallback(
    () => runTicketAction('activate', {}, 'Unable to activate this ticket.'),
    [runTicketAction],
  );

  const close = useCallback(
    () => runTicketAction('close', {}, 'Unable to close this ticket.'),
    [runTicketAction],
  );

  const reassign = useCallback((toUserId: string, reason?: string) => runTicketAction('reassign', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to_user_id: Number(toUserId), reason: reason || undefined }),
  }, 'Unable to reassign this ticket.'), [runTicketAction]);

  return {
    ticket,
    messages,
    reassignments,
    loadError,
    pendingAction,
    notifyActivity,
    sendMessage,
    activate,
    close,
    reassign,
  };
}

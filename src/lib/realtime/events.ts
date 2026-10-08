/**
 * Events the backend broadcasts on the user's private channel `users.{id}`
 * (see "Real-time (WebSockets)" in the backend API contract). Payloads are the
 * raw API Resource shapes, the same as the REST endpoints return.
 */
export type RealtimeEventName =
  | 'notification.created'
  | 'message.sent'
  | 'ticket.updated';

export const REALTIME_EVENTS: RealtimeEventName[] = [
  'notification.created',
  'message.sent',
  'ticket.updated',
];

export type RealtimeHandler = (payload: any) => void;

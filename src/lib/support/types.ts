/** Ticket data as the support UI uses it (normalized from the backend in lib/support/backend.ts). */

export type TicketStatus = 'new' | 'active' | 'closed';

export interface TicketAttachment {
  id?: string;
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  type?: 'message' | 'system';
  readAt?: string | null;
  attachments?: TicketAttachment[];
  createdAt: string;
}

export interface ReassignmentEvent {
  from: string;
  to: string;
  note: string;
  at: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  handledBy?: string;
  handledById?: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
  organizationName?: string;
  messages: TicketMessage[];
  reassignmentHistory: ReassignmentEvent[];
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  organization: string;
}

/** `type` values the backend writes to the notifications table. */
export type NotificationType =
  | 'ticket.created'
  | 'ticket.activated'
  | 'ticket.reassigned'
  | 'ticket.closed'
  | 'message.sent';

export interface SupportNotification {
  id: string;
  /** A NotificationType, or a newer type this frontend doesn't know yet. */
  type: string;
  /** The ticket to open on click (null if the notification isn't about one). */
  ticketId: string | null;
  /** Ticket subject, for ticket.* notifications. */
  subject: string | null;
  /** Message excerpt (max 140 chars), for message.sent. */
  preview: string | null;
  readAt: string | null;
  createdAt: string;
}

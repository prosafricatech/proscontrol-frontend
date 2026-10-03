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

/** `action` values the backend writes to the activity log. */
export type ActivityAction =
  | 'ticket.created'
  | 'ticket.activated'
  | 'ticket.reassigned'
  | 'ticket.closed'
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.registered'
  | 'auth.verified';

/** Groups of actions the activity log can be filtered by. */
export type ActivityCategory = 'ticket' | 'auth';

/** Whether a staff member or a customer (including guests) acted. */
export type ActivityActorType = 'staff' | 'customer';

export interface ActivityEntry {
  id: string;
  /** An ActivityAction, or a newer action this frontend doesn't know yet. */
  action: string;
  actorName: string | null;
  actorEmail: string | null;
  /**
   * The actor's role. For a failed sign-in (no actor) it's the type of the
   * account that was targeted, or null when the identifier matched nobody.
   */
  accountType: ActivityActorType | null;
  /** Null for sign-in entries, which aren't about a ticket. */
  ticketId: string | null;
  subject: string | null;
  /** Reassignments only. */
  fromName: string | null;
  toName: string | null;
  reason: string | null;
  /** Sign-ins only: 'proserp' or 'guest'. */
  method: string | null;
  /** Failed sign-ins only: the email or phone that was tried. */
  identifier: string | null;
  /** Verifications only: 'email' or 'phone'. */
  channel: string | null;
  /** As the backend saw it (may be the frontend server's address). */
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

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

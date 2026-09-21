'use client';

export type TicketStatus = 'new' | 'active' | 'closed';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  attachments?: { name: string; url: string }[];
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
  customerName: string;
  customerEmail: string;
  handledBy?: string;
  handledById?: string;
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

const defaultDate = '2026-09-21T09:00:00.000Z';

export const supportCustomers: CustomerSummary[] = [
  { id: 'cust-1', name: 'Willbard Beatus', email: 'willbard@proscontrol.com', organization: 'ProsControl Labs' },
  { id: 'cust-2', name: 'Grace Mkilima', email: 'grace@proscontrol.com', organization: 'Nairobi HQ' },
  { id: 'cust-3', name: 'Amina Yusuf', email: 'amina@proscontrol.com', organization: 'Coastal Retail' },
];

export const supportTickets: Ticket[] = [
  {
    id: 'TCK-1001',
    subject: 'Unable to sync warehouse stock',
    description: 'The stock sync job has stopped updating after the last deployment. We need help validating the inventory counts in the procurement module.',
    status: 'active',
    customerName: 'Willbard Beatus',
    customerEmail: 'willbard@proscontrol.com',
    handledBy: 'Lilian M.',
    handledById: 'staff-1',
    createdAt: '2026-09-20T10:15:00.000Z',
    updatedAt: '2026-09-21T08:45:00.000Z',
    organizationId: 'org-1',
    messages: [
      {
        id: 'msg-1',
        senderId: 'cust-1',
        senderName: 'Willbard Beatus',
        body: 'The stock sync job has stopped updating after the last deployment. We need help validating the inventory counts in the procurement module.',
        createdAt: '2026-09-20T10:16:00.000Z',
      },
      {
        id: 'msg-2',
        senderId: 'staff-1',
        senderName: 'Lilian M.',
        body: 'Thanks for flagging this. I have checked the last sync run and I am reviewing the inventory mapping. I will share a fix plan shortly.',
        createdAt: '2026-09-21T08:45:00.000Z',
      },
    ],
    reassignmentHistory: [
      { from: 'Unassigned', to: 'Lilian M.', note: 'First assignment', at: '2026-09-21T08:00:00.000Z' },
    ],
  },
  {
    id: 'TCK-1002',
    subject: 'Billing export failed for August',
    description: 'The finance team cannot download the August billing export and the portal shows a processing error.',
    status: 'new',
    customerName: 'Grace Mkilima',
    customerEmail: 'grace@proscontrol.com',
    handledBy: undefined,
    handledById: undefined,
    createdAt: '2026-09-21T07:30:00.000Z',
    updatedAt: '2026-09-21T07:30:00.000Z',
    organizationId: 'org-2',
    messages: [
      {
        id: 'msg-3',
        senderId: 'cust-2',
        senderName: 'Grace Mkilima',
        body: 'The finance team cannot download the August billing export and the portal shows a processing error.',
        createdAt: '2026-09-21T07:30:00.000Z',
      },
    ],
    reassignmentHistory: [
      { from: 'Unassigned', to: 'Unassigned', note: 'Created', at: defaultDate },
    ],
  },
  {
    id: 'TCK-1003',
    subject: 'Payment approval not visible to approver',
    description: 'The direct manager is not seeing the payment approval queue even though the transaction is approved.',
    status: 'closed',
    customerName: 'Amina Yusuf',
    customerEmail: 'amina@proscontrol.com',
    handledBy: 'Daniel K.',
    handledById: 'staff-2',
    createdAt: '2026-09-18T13:00:00.000Z',
    updatedAt: '2026-09-20T16:50:00.000Z',
    organizationId: 'org-3',
    messages: [
      {
        id: 'msg-4',
        senderId: 'cust-3',
        senderName: 'Amina Yusuf',
        body: 'The direct manager is not seeing the payment approval queue even though the transaction is approved.',
        createdAt: '2026-09-18T13:00:00.000Z',
      },
      {
        id: 'msg-5',
        senderId: 'staff-2',
        senderName: 'Daniel K.',
        body: 'We have fixed the role permission mismatch and the approver queue is now visible. Closing the ticket.',
        createdAt: '2026-09-20T16:50:00.000Z',
      },
    ],
    reassignmentHistory: [
      { from: 'Unassigned', to: 'Daniel K.', note: 'First assignment', at: '2026-09-18T13:30:00.000Z' },
      { from: 'Daniel K.', to: 'Daniel K.', note: 'Resolved', at: '2026-09-20T16:50:00.000Z' },
    ],
  },
];

export const getSupportTickets = () => [...supportTickets];

export const getSupportTicketById = (ticketId: string) =>
  supportTickets.find((ticket) => ticket.id === ticketId) ?? null;

export const getSupportCustomers = () => [...supportCustomers];

export const getSupportStats = () => ({
  total: supportTickets.length,
  new: supportTickets.filter((t) => t.status === 'new').length,
  active: supportTickets.filter((t) => t.status === 'active').length,
  closed: supportTickets.filter((t) => t.status === 'closed').length,
  unassigned: supportTickets.filter((t) => !t.handledBy).length,
});

export const createTicketRecord = (input: {
  subject: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  organizationId?: string;
  organizationName?: string;
  status?: TicketStatus;
}) => {
  const ticket: Ticket = {
    id: `TCK-${Date.now()}`,
    subject: input.subject,
    description: input.description,
    status: input.status ?? 'new',
    customerName: input.customerName ?? 'Guest Customer',
    customerEmail: input.customerEmail ?? 'guest@proscontrol.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    messages: [
      {
        id: `msg-${Date.now()}`,
        senderId: 'customer-user',
        senderName: input.customerName ?? 'Guest Customer',
        body: input.description,
        createdAt: new Date().toISOString(),
      },
    ],
    reassignmentHistory: [{ from: 'Unassigned', to: 'Unassigned', note: 'Created', at: new Date().toISOString() }],
  };

  supportTickets.unshift(ticket);
  return ticket;
};

export const addMessageToTicket = (ticketId: string, message: { senderId: string; senderName: string; body: string }) => {
  const target = getSupportTicketById(ticketId);
  if (!target) return null;

  const newMessage: TicketMessage = {
    id: `msg-${Date.now()}`,
    senderId: message.senderId,
    senderName: message.senderName,
    body: message.body,
    createdAt: new Date().toISOString(),
  };

  target.messages.push(newMessage);
  target.updatedAt = new Date().toISOString();
  target.status = 'active';
  return newMessage;
};

export const closeTicketById = (ticketId: string) => {
  const target = getSupportTicketById(ticketId);
  if (!target) return null;

  target.status = 'closed';
  target.updatedAt = new Date().toISOString();
  return target;
};

export const reassignTicket = (ticketId: string, nextOwner: string) => {
  const target = getSupportTicketById(ticketId);
  if (!target) return null;

  const previousOwner = target.handledBy ?? 'Unassigned';
  target.handledBy = nextOwner;
  target.handledById = `staff-${nextOwner.toLowerCase().replace(/\s+/g, '-')}`;
  target.updatedAt = new Date().toISOString();
  target.reassignmentHistory.push({
    from: previousOwner,
    to: nextOwner,
    note: 'Reassigned',
    at: new Date().toISOString(),
  });
  return target;
};

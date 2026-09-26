import { getAuthHeaders } from '@/lib/utils/apiUtils';
import { NextRequest, NextResponse } from 'next/server';
import type { ReassignmentEvent, TicketAttachment, TicketMessage, TicketStatus } from '@/lib/support/mockData';

const API_BASE = process.env.API_BASE_URL;

// Safety cap when walking paginated backend lists (backend pages hold 15 rows).
const MAX_PAGES = 50;

type BackendUser = {
  id?: string | number;
  name?: string;
  email?: string;
};

type BackendTicket = {
  id: string | number;
  subject?: string;
  notes?: string | null;
  organization_name?: string | null;
  status?: string;
  user?: BackendUser | null;
  attended_by?: BackendUser | null;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type BackendAttachment = {
  id: string | number;
  filename?: string;
  mime_type?: string;
  size?: number;
};

type BackendMessage = {
  id: string | number;
  sender?: BackendUser | null;
  type?: 'message' | 'system';
  body?: string;
  sent_at?: string | null;
  read_at?: string | null;
  created_at?: string;
  attachments?: BackendAttachment[];
};

type BackendReassignment = {
  from_user?: BackendUser | null;
  to_user?: BackendUser | null;
  reassigned_by?: BackendUser | null;
  reason?: string | null;
  created_at?: string;
};

export function normalizeTicket(ticket: BackendTicket) {
  return {
    id: String(ticket.id),
    subject: ticket.subject ?? '',
    description: ticket.notes ?? '',
    status: (ticket.status ?? 'new') as TicketStatus,
    customerId: ticket.user?.id ? String(ticket.user.id) : undefined,
    customerName: ticket.user?.name ?? 'Customer',
    customerEmail: ticket.user?.email ?? '',
    handledBy: ticket.attended_by?.name,
    handledById: ticket.attended_by?.id ? String(ticket.attended_by.id) : undefined,
    closedAt: ticket.closed_at ?? null,
    createdAt: ticket.created_at ?? '',
    updatedAt: ticket.updated_at ?? ticket.created_at ?? '',
    organizationName: ticket.organization_name ?? undefined,
    messages: [],
    reassignmentHistory: [],
  };
}

export function normalizeAttachment(attachment: BackendAttachment): TicketAttachment {
  return {
    id: String(attachment.id),
    name: attachment.filename ?? 'attachment',
    url: `/api/support/attachments/${attachment.id}`,
    mimeType: attachment.mime_type,
    size: attachment.size,
  };
}

export function normalizeMessage(message: BackendMessage): TicketMessage {
  return {
    id: String(message.id),
    senderId: message.sender?.id ? String(message.sender.id) : '',
    senderName: message.sender?.name ?? '',
    body: message.body ?? '',
    type: message.type ?? 'message',
    readAt: message.read_at ?? null,
    attachments: (message.attachments ?? []).map(normalizeAttachment),
    createdAt: message.sent_at ?? message.created_at ?? '',
  };
}

export function normalizeReassignment(reassignment: BackendReassignment): ReassignmentEvent {
  return {
    from: reassignment.from_user?.name ?? '',
    to: reassignment.to_user?.name ?? '',
    note: reassignment.reason ?? '',
    at: reassignment.created_at ?? '',
  };
}

/**
 * Raw call to the Laravel API with the session's Bearer token. Returns a
 * NextResponse when the call can't be made at all (not configured), so
 * callers can return it straight away.
 */
export async function fetchBackend(request: NextRequest, path: string, init: RequestInit = {}) {
  const { headers, response } = await getAuthHeaders(request, false);
  if (response) return response;

  if (!API_BASE) {
    return NextResponse.json({ message: 'API_BASE_URL is not configured' }, { status: 500 });
  }

  const requestHeaders = new Headers(headers ?? {});
  new Headers(init.headers).forEach((value, key) => requestHeaders.set(key, value));

  // Let fetch set the multipart boundary itself; a forced JSON (or boundary-less
  // multipart) Content-Type makes Laravel drop the uploaded files.
  if (init.body instanceof FormData || !init.body) {
    requestHeaders.delete('Content-Type');
  }

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: requestHeaders,
    cache: 'no-store',
  });
}

export async function requestBackend(request: NextRequest, path: string, init: RequestInit = {}) {
  const backendResponse = await fetchBackend(request, path, init);
  if (backendResponse instanceof NextResponse) return backendResponse;

  const payload = await backendResponse.json().catch(() => null);

  return { response: backendResponse, payload };
}

/**
 * Walk every page of a paginated backend list (`data: { items, meta }`) and
 * return all items. Stops at the first failed page and hands back its
 * response so the caller can relay the error.
 */
export async function requestAllPages(request: NextRequest, path: string) {
  const separator = path.includes('?') ? '&' : '?';
  const items: any[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const result = await requestBackend(request, `${path}${separator}page=${page}`);
    if (result instanceof NextResponse) return result;
    if (!result.response.ok) return { ok: false as const, ...result };

    const data = backendData(result.payload);
    items.push(...(Array.isArray(data?.items) ? data.items : []));
    lastPage = Number(data?.meta?.last_page ?? 1);
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);

  return { ok: true as const, items };
}

export type PageMeta = { current_page: number; last_page: number; per_page: number; total: number };

/**
 * One page of a paginated backend list (`data: { items, meta }`). Returns the
 * failed result instead when the call fails, so the caller can relay it.
 */
export async function requestPage(request: NextRequest, path: string, page = 1) {
  const separator = path.includes('?') ? '&' : '?';
  const result = await requestBackend(request, `${path}${separator}page=${page}`);
  if (result instanceof NextResponse) return result;
  if (!result.response.ok) return { ok: false as const, ...result };

  const data = backendData(result.payload);
  const meta: PageMeta = {
    current_page: Number(data?.meta?.current_page ?? page),
    last_page: Number(data?.meta?.last_page ?? 1),
    per_page: Number(data?.meta?.per_page ?? 15),
    total: Number(data?.meta?.total ?? 0),
  };

  return { ok: true as const, items: Array.isArray(data?.items) ? data.items : [], meta };
}

export function backendData(payload: any) {
  return payload?.data ?? null;
}

export function ticketList(payload: any) {
  const data = backendData(payload);
  const tickets = Array.isArray(data) ? data : data?.items;

  return Array.isArray(tickets) ? tickets.map(normalizeTicket) : [];
}

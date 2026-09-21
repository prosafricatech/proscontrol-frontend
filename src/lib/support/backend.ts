import { getAuthHeaders } from '@/lib/utils/apiUtils';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

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
  created_at?: string;
  updated_at?: string;
};

export function normalizeTicket(ticket: BackendTicket) {
  return {
    id: String(ticket.id),
    subject: ticket.subject ?? '',
    description: ticket.notes ?? '',
    status: ticket.status ?? 'new',
    customerName: ticket.user?.name ?? 'Customer',
    customerEmail: ticket.user?.email ?? '',
    handledBy: ticket.attended_by?.name,
    handledById: ticket.attended_by?.id ? String(ticket.attended_by.id) : undefined,
    createdAt: ticket.created_at ?? '',
    updatedAt: ticket.updated_at ?? ticket.created_at ?? '',
    organizationName: ticket.organization_name ?? undefined,
    messages: [],
    reassignmentHistory: [],
  };
}

export async function requestBackend(request: NextRequest, path: string, init: RequestInit = {}) {
  const { headers, response } = await getAuthHeaders(request, false);
  if (response) return response;

  if (!API_BASE) {
    return NextResponse.json({ message: 'API_BASE_URL is not configured' }, { status: 500 });
  }

  const responseHeaders = new Headers(headers ?? {});
  new Headers(init.headers).forEach((value, key) => responseHeaders.set(key, value));

  const backendResponse = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: responseHeaders,
    cache: 'no-store',
  });
  const payload = await backendResponse.json().catch(() => null);

  return { response: backendResponse, payload };
}

export function backendData(payload: any) {
  return payload?.data ?? null;
}

export function ticketList(payload: any) {
  const data = backendData(payload);
  const tickets = Array.isArray(data) ? data : data?.items;

  return Array.isArray(tickets) ? tickets.map(normalizeTicket) : [];
}
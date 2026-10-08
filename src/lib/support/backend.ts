import { getAuthHeaders } from '@/lib/utils/apiUtils';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeTicket } from './normalize';

// The normalizers moved to ./normalize (usable in the browser too); re-exported
// here so the API routes keep importing them from one place.
export {
  normalizeActivityEntry,
  normalizeAttachment,
  normalizeMessage,
  normalizeNotification,
  normalizeReassignment,
  normalizeTicket,
} from './normalize';

const API_BASE = process.env.API_BASE_URL;

// Safety cap when walking paginated backend lists (backend pages hold 15 rows).
const MAX_PAGES = 50;

/**
 * Raw call to the Laravel API with the session's Bearer token. Returns a
 * NextResponse when the call can't be made at all (not configured), so
 * callers can return it straight away.
 */
export async function fetchBackend(
  request: NextRequest,
  path: string,
  init: RequestInit = {}
) {
  const { headers, response } = await getAuthHeaders(request, false);
  if (response) return response;

  if (!API_BASE) {
    return NextResponse.json(
      { message: 'API_BASE_URL is not configured' },
      { status: 500 }
    );
  }

  const requestHeaders = new Headers(headers ?? {});
  new Headers(init.headers).forEach((value, key) =>
    requestHeaders.set(key, value)
  );

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

export async function requestBackend(
  request: NextRequest,
  path: string,
  init: RequestInit = {}
) {
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
    const result = await requestBackend(
      request,
      `${path}${separator}page=${page}`
    );
    if (result instanceof NextResponse) return result;
    if (!result.response.ok) return { ok: false as const, ...result };

    const data = backendData(result.payload);
    items.push(...(Array.isArray(data?.items) ? data.items : []));
    lastPage = Number(data?.meta?.last_page ?? 1);
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);

  return { ok: true as const, items };
}

export type PageMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

/**
 * One page of a paginated backend list (`data: { items, meta }`). Returns the
 * failed result instead when the call fails, so the caller can relay it.
 */
export async function requestPage(
  request: NextRequest,
  path: string,
  page = 1
) {
  const separator = path.includes('?') ? '&' : '?';
  const result = await requestBackend(
    request,
    `${path}${separator}page=${page}`
  );
  if (result instanceof NextResponse) return result;
  if (!result.response.ok) return { ok: false as const, ...result };

  const data = backendData(result.payload);
  const meta: PageMeta = {
    current_page: Number(data?.meta?.current_page ?? page),
    last_page: Number(data?.meta?.last_page ?? 1),
    per_page: Number(data?.meta?.per_page ?? 15),
    total: Number(data?.meta?.total ?? 0),
  };

  return {
    ok: true as const,
    items: Array.isArray(data?.items) ? data.items : [],
    meta,
  };
}

export function backendData(payload: any) {
  return payload?.data ?? null;
}

export function ticketList(payload: any) {
  const data = backendData(payload);
  const tickets = Array.isArray(data) ? data : data?.items;

  return Array.isArray(tickets) ? tickets.map(normalizeTicket) : [];
}

import { normalizeActivityEntry, requestPage } from '@/lib/support/backend';
import { NextRequest, NextResponse } from 'next/server';

/**
 * One page (15) of the audit log, newest first. Staff only (the backend
 * returns 403 otherwise). Query: `action`, `category`, `ticket_id`,
 * `actor_type`, `search`, `from`, `to` (ISO date-times) and `page`.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const query = new URLSearchParams();
  const filters = [
    'action',
    'category',
    'ticket_id',
    'actor_type',
    'search',
    'from',
    'to',
  ];
  for (const filter of filters) {
    const value = params.get(filter);
    if (value) {
      query.set(filter, value);
    }
  }

  const queryString = query.toString();
  const result = await requestPage(
    request,
    `/activity-logs${queryString ? `?${queryString}` : ''}`,
    page
  );

  if (result instanceof NextResponse) {
    return result;
  }
  if (!result.ok) {
    return NextResponse.json(result.payload, {
      status: result.response.status,
    });
  }

  return NextResponse.json({
    data: result.items.map(normalizeActivityEntry),
    meta: result.meta,
  });
}

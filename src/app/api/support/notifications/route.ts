import { normalizeNotification, requestPage } from '@/lib/support/backend';
import { NextRequest, NextResponse } from 'next/server';

/**
 * One page (15) of the signed-in user's notifications, newest first.
 * Query: `page`, `unread_only`.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get('page')) || 1);
  const unreadOnly =
    params.get('unread_only') === '1' || params.get('unread_only') === 'true';

  const path = unreadOnly ? '/notifications?unread_only=1' : '/notifications';
  const result = await requestPage(request, path, page);

  if (result instanceof NextResponse) {
    return result;
  }
  if (!result.ok) {
    return NextResponse.json(result.payload, {
      status: result.response.status,
    });
  }

  return NextResponse.json({
    data: result.items.map(normalizeNotification),
    meta: result.meta,
  });
}

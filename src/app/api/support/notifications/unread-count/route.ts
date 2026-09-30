import { backendData, requestBackend } from '@/lib/support/backend';
import { NextRequest, NextResponse } from 'next/server';

/** Unread count for the bell badge (cheap to poll). */
export async function GET(request: NextRequest) {
  const result = await requestBackend(request, '/notifications/unread-count');

  if (result instanceof NextResponse) {
    return result;
  }
  if (!result.response.ok) {
    return NextResponse.json(result.payload, {
      status: result.response.status,
    });
  }

  return NextResponse.json({
    data: { count: Number(backendData(result.payload)?.count ?? 0) },
  });
}

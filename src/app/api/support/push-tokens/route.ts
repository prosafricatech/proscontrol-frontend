import { requestBackend } from '@/lib/support/backend';
import { NextRequest, NextResponse } from 'next/server';

/** Forwards `{ token }` to the backend's push-token endpoint. */
async function forwardToken(request: NextRequest, method: 'POST' | 'DELETE') {
  const body = await request.json().catch(() => ({}));
  const result = await requestBackend(request, '/push-tokens', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: body?.token }),
  });

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result.payload, { status: result.response.status });
}

/** Registers this browser for push notifications. */
export function POST(request: NextRequest) {
  return forwardToken(request, 'POST');
}

/** Stops push notifications to this browser. */
export function DELETE(request: NextRequest) {
  return forwardToken(request, 'DELETE');
}

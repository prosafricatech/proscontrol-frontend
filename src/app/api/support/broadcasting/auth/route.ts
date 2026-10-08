import { requestBackend } from '@/lib/support/backend';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Authorizes this user's private WebSocket channel. The browser's Echo client
 * calls this route; it adds the Bearer token server-side (the token never
 * reaches the browser) and forwards to Laravel's broadcast auth endpoint.
 * Body: `{ socket_id, channel_name }`.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const result = await requestBackend(request, '/broadcasting/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      socket_id: body?.socket_id,
      channel_name: body?.channel_name,
    }),
  });

  if (result instanceof NextResponse) {
    return result;
  }

  // Pusher-protocol answer ({ auth }) passed through as-is, not enveloped.
  return NextResponse.json(result.payload, { status: result.response.status });
}

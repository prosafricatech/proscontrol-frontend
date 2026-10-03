import { requestBackend } from '@/lib/support/backend';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Revokes the session's backend token (and records the sign-out in the
 * activity log). Call it before next-auth's signOut, which only clears the
 * session cookie.
 */
export async function POST(request: NextRequest) {
  const result = await requestBackend(request, '/auth/logout', {
    method: 'POST',
  });

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result.payload, { status: result.response.status });
}

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedRequestHeaders } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL;

/**
 * Forward an unauthenticated auth call (register / verify / resend) to the
 * backend and relay its { code, message, data } envelope unchanged.
 */
export async function forwardAuthRequest(req: NextRequest, path: string, body: Record<string, unknown>) {
  if (!API_BASE) {
    return NextResponse.json({ code: 500, message: 'API_BASE_URL is not configured', data: null }, { status: 500 });
  }

  const headers = getForwardedRequestHeaders({
    headers: req.headers,
    geo: 'geo' in req && typeof (req as any).geo === 'object' ? (req as any).geo : undefined,
  });

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const payload = await res.json().catch(() => null);

    return NextResponse.json(
      payload ?? { code: res.status, message: 'Unexpected response from server', data: null },
      { status: res.status },
    );
  } catch {
    return NextResponse.json({ code: 503, message: 'Unable to reach the server. Please try again.', data: null }, { status: 503 });
  }
}

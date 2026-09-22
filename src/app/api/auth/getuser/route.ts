import { getAuthHeaders } from '@/lib/utils/apiUtils';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function GET(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await res.json();
  const user = payload?.data?.user;

  if (!res.ok || !user) {
    return NextResponse.json(payload, { status: res.status });
  }

  return NextResponse.json(
    {
      authUser: {
        user,
        permissions: user.permissions || [],
      },
      authOrganization: null,
    },
    { status: res.status },
  );
}

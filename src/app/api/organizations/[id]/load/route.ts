import { SESSION_COOKIE_NAME } from '@/lib/auth/sessionCookie';
import { NextRequest, NextResponse } from 'next/server';
import { encode, JWT } from 'next-auth/jwt';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL;

export async function PUT(req: NextRequest) {
  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (!API_BASE) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const body = await req.json();
  const { organization_id } = body;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/organizations/${organization_id}/load`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({ organization_id }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to load organization' }, { status: res.status });
  }

  if (data?.token && data?.authUser?.user && data?.authOrganization?.organization?.id) {
    const jwtPayload: JWT = {
      user: {
        id: data.authUser.user.id,
        name: data.authUser.user.name,
        email: data.authUser.user.email,
      },
      accessToken: data.token,
      organization_id: data.authOrganization.organization.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };

    const sessionToken = await encode({
      token: jwtPayload,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const response = NextResponse.json({
      message: 'Organization is loaded to an active organization',
      data: {
        authUser: data.authUser,
        authOrganization: data.authOrganization,
      },
    });

    // Clear existing session cookies (including chunked cookies)
    const cookieName = SESSION_COOKIE_NAME;
    
    // Delete the primary session cookie
    response.cookies.delete(cookieName);
    
    // Delete any chunked cookies
    for (let i = 0; i < 10; i++) {
      response.cookies.delete(`${cookieName}.${i}`);
    }

    // Set the new session cookie
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only secure in prod (https)
      path: '/',
      sameSite: 'lax', // works better for SSR + API routes
      maxAge: 60 * 60 * 24,
    });

    return response;
  }

  return handleJsonResponse(res);
}
import { NextRequest, NextResponse } from 'next/server';
import { encode, JWT } from 'next-auth/jwt';
import { getForwardedRequestHeaders } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL;

export async function POST(req: NextRequest) {
  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json(
      { error: 'Server configuration error (missing NEXTAUTH_SECRET)' },
      { status: 500 },
    );
  }

  if (!API_BASE) {
    return NextResponse.json(
      { error: 'Server configuration error (missing API_BASE_URL)' },
      { status: 500 },
    );
  }

  const body = await req.json();
  const headers = getForwardedRequestHeaders({
    headers: req.headers,
    geo: 'geo' in req && typeof (req as any).geo === 'object' ? (req as any).geo : undefined,
  });

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: body.name ?? body.fullName,
      email: body.email,
      phone: body.phone,
      password: body.password,
      password_confirmation: body.password_confirmation ?? body.confirmPassword ?? body.password,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message || 'Failed to register user' },
      { status: res.status },
    );
  }

  if (data?.data?.token && data?.data?.user) {
    const jwtPayload: JWT = {
      user: {
        id: data.data.user.id,
        name: data.data.user.name,
        email: data.data.user.email,
      },
      accessToken: data.data.token,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
    };

    const sessionToken = await encode({
      token: jwtPayload,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const response = NextResponse.json({
      message: 'User registered successfully',
      authUser: { user: data.data.user, permissions: [] },
    });

    // Clear existing session cookies
    const cookieName =
      process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token';

    response.cookies.delete(cookieName);
    for (let i = 0; i < 10; i++) {
      response.cookies.delete(`${cookieName}.${i}`);
    }

    // Set new session cookie
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      domain:
        process.env.NODE_ENV === 'production'
          ? '.proserp.co.tz'
          : undefined,
      maxAge: 60 * 60 * 24, // 24h
    });

    return response;
  }

  return NextResponse.json(data, { status: res.status });
}

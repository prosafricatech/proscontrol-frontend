import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.includes('/auth/verifyEmail') ||
    pathname === '/api/auth/status' ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('/auth/verify-email')
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const statusRes = await fetch(new URL('/api/auth/status', request.url), {
    headers: request.headers,
  });

  if (!statusRes.ok) {
    return createAuthRedirect(request);
  }

  const { authenticated, verified } = await statusRes.json();

  if (!authenticated) {
    return createAuthRedirect(request);
  }

  if (!verified) {
    const lang = pathname.split('/')[1] || 'en-US';
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/auth/verifyEmail`;
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export async function anonymousMiddleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: COOKIE_NAME,
  });

  const pathname = request.nextUrl.pathname;

  if (pathname.includes('/auth/verifyEmail')) {
    return NextResponse.next();
  }

  if (token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// --- Helpers ---
function createAuthRedirect(request: NextRequest, error?: string) {
  const callbackPath = request.nextUrl.pathname;

  if (callbackPath.includes('/auth/signin')) {
    return NextResponse.next();
  }

  const url = new URL('/auth/signin', request.url);
  url.searchParams.set('callbackUrl', callbackPath);
  if (error) url.searchParams.set('error', error);
  return NextResponse.redirect(url);
}

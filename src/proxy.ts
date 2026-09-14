import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, anonymousMiddleware } from '@/middleware/auth';
import { isPublicPath, isAnonymousPath } from '@/utilities/helpers/path';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { prefixLocale } from './middleware/locale';

// Locale configuration
const headers = { 'accept-language': 'en-US,en;q=0.5' };
const locales = ['en-US', 'ar-SA', 'es-ES', 'fr-FR', 'it-IT', 'zh-CN'];
const defaultLocale = 'en-US';

export const activeLocale = match(
  new Negotiator({ headers }).languages(),
  locales,
  defaultLocale
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect only GET requests to /api/auth/signout to /auth/signin to avoid confirmation page
  if (pathname === '/api/auth/signout' && request.method === 'GET') {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // 1. Handle locale redirection
  const localeResponse = prefixLocale(request);
  if (localeResponse) {
    return NextResponse.redirect(localeResponse);
  }

  // 2. Public paths (assets, etc.)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 3. Authentication pages (login/signup)
  if (isAnonymousPath(pathname)) {
    return anonymousMiddleware(request);
  }

  // 4. All other routes require authentication
  return authMiddleware(request);
}

export const config = {
  // /api is excluded here even though authMiddleware() already no-ops for
  // it (pathname.startsWith('/api') → NextResponse.next()) — that no-op
  // still runs on the Edge Runtime, which streams/buffers request bodies
  // more restrictively than a normal Node.js route handler. A large
  // multipart body (a file upload) passing through it first can fail even
  // though the actual API route handles it fine on its own — confirmed by
  // uploading a ~3.7MB PDF straight to Laravel (succeeds) vs through the
  // app (failed with an empty response). Excluding /api changes no
  // behavior, since the auth check was already a pass-through for it.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|firebase-messaging-sw.js|api).*)'],
};
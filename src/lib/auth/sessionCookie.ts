/**
 * ProsControl's own next-auth cookie names.
 *
 * Browsers share cookies between ports, so with next-auth's default names
 * ProsControl and prosERP (both on localhost, or on sibling subdomains)
 * overwrite each other's session: signing in to one signs you out of the
 * other. A ProsControl prefix keeps the two apps apart.
 */

const isProduction = process.env.NODE_ENV === 'production';

// __Secure- / __Host- make the browser refuse these cookies over plain http.
export const SESSION_COOKIE_NAME = isProduction
  ? '__Secure-proscontrol.session-token'
  : 'proscontrol.session-token';

const CSRF_COOKIE_NAME = isProduction
  ? '__Host-proscontrol.csrf-token'
  : 'proscontrol.csrf-token';

const CALLBACK_COOKIE_NAME = isProduction
  ? '__Secure-proscontrol.callback-url'
  : 'proscontrol.callback-url';

const baseOptions = {
  sameSite: 'lax' as const,
  path: '/',
  secure: isProduction,
};

/** The `cookies` option for NextAuth. */
export const nextAuthCookies = {
  sessionToken: {
    name: SESSION_COOKIE_NAME,
    options: { ...baseOptions, httpOnly: true },
  },
  csrfToken: {
    name: CSRF_COOKIE_NAME,
    options: { ...baseOptions, httpOnly: true },
  },
  callbackUrl: {
    name: CALLBACK_COOKIE_NAME,
    options: baseOptions,
  },
};

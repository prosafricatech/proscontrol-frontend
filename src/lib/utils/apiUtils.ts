import { SESSION_COOKIE_NAME } from '@/lib/auth/sessionCookie';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import axios from '@/lib/services/config';

type GeoData = {
  country?: string;
  region?: string;
  city?: string;
  latitude?: string;
  longitude?: string;
};

type HeaderCarrier = {
  headers: Headers;
  geo?: GeoData;
};

type HeaderValue = string | string[] | undefined | null;

type HeadersInput =
  | Headers
  | {
      [key: string]: HeaderValue;
    };

const getHeaderValue = (headers: HeadersInput, name: string) => {
  if (!headers) return null;

  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name);
  }

  const headerRecord = headers as Record<string, HeaderValue>;
  const value =
    headerRecord[name] ??
    headerRecord[name.toLowerCase()] ??
    headerRecord[name.toUpperCase()];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

const getClientIpAddress = (headers: HeadersInput) => {
  const forwardedFor =
    getHeaderValue(headers, 'x-forwarded-for') ||
    getHeaderValue(headers, 'x-vercel-forwarded-for') ||
    getHeaderValue(headers, 'cf-connecting-ip') ||
    getHeaderValue(headers, 'true-client-ip') ||
    getHeaderValue(headers, 'x-client-ip');

  const realIp = getHeaderValue(headers, 'x-real-ip');
  const forwarded = getHeaderValue(headers, 'forwarded');

  const forwardedToken = forwarded
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith('for='));

  const forwardedIp = forwardedToken
    ? forwardedToken
        .replace(/^for=/i, '')
        .replace(/\"/g, '')
        .split(',')[0]
        .trim()
    : null;

  const firstForwardedFor = forwardedFor?.split(',')[0]?.trim();
  const ipAddress = firstForwardedFor || realIp || forwardedIp || 'unknown';

  return {
    forwardedFor,
    realIp,
    ipAddress,
  };
};

export function getForwardedRequestHeadersFromHeaders(
  headers: HeadersInput,
  geo?: GeoData
) {
  const { forwardedFor, realIp, ipAddress } = getClientIpAddress(headers);
  const userAgent =
    getHeaderValue(headers, 'user-agent') ||
    getHeaderValue(headers, 'x-user-agent') ||
    'unknown';
  const reqTimezone = getHeaderValue(headers, 'x-timezone') || '';

  const safeGeo: GeoData = geo && typeof geo === 'object' ? geo : {};

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Timezone': reqTimezone,
    'User-Agent': userAgent,
    'X-User-Agent': userAgent,
    'X-Forwarded-For': forwardedFor || ipAddress,
    'X-Real-IP': realIp || ipAddress,
    'X-Device-IP': ipAddress,
    'X-Country': safeGeo.country ?? '',
    'X-Region': safeGeo.region ?? '',
    'X-City': safeGeo.city ?? '',
    'X-Latitude': safeGeo.latitude ?? '',
    'X-Longitude': safeGeo.longitude ?? '',
  };
}

export function getForwardedRequestHeaders(req: HeaderCarrier) {
  return getForwardedRequestHeadersFromHeaders(req.headers, req.geo);
}

export async function getAuthHeaders(
  req: NextRequest,
  requireAuth = true
) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: SESSION_COOKIE_NAME,
  });

  if (requireAuth && !token?.accessToken) {
    return {
      headers: null,
      response: NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }
  
  const headers: Record<string, string> = getForwardedRequestHeaders({
    headers: req.headers,
    geo: 'geo' in req && typeof (req as any).geo === 'object' ? (req as any).geo : undefined,
  });

  if (token?.accessToken) {
    headers.Authorization = `Bearer ${token.accessToken}`;

    if (token.organization_id) {
      headers['X-OrganizationId'] = String(token.organization_id);
    }

    if (token.user_id) {
      headers['X-UserId'] = String(token.user_id);
    }
  }

  return { headers, response: null };
}

/** -----------------------------------
 * JSON response normalizer
 * ----------------------------------- */
export async function handleJsonResponse(res: Response) {
  const contentType = res.headers.get('content-type');

  if (!contentType?.includes('application/json')) {
    const text = await res.text();
    return NextResponse.json(
      { message: text },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

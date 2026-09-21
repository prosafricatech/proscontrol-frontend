import { NextRequest } from 'next/server';
import { getAuthHeaders } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL;

export async function GET(req: NextRequest) {
  const { headers, response: authResponse } = await getAuthHeaders(req);
  if (authResponse) return authResponse;

  if (!API_BASE) {
    return Response.json(
      { 
        authenticated: false, 
        verified: false,
        error: 'API_BASE_URL not configured'
      },
      { status: 500 }
    );
  }

  try {
    const url = `${API_BASE}/auth/me`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-store',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!res.ok) {
      return Response.json(
        { authenticated: false, verified: false },
        { status: res.status }
      );
    }

    const data = await res.json();

    const user = data?.data?.user;
    const isVerified = !!user?.email_verified_at;

    return Response.json({
      authenticated: true,
      verified: isVerified,
      user: user || null,
    });
  } catch (error: any) {
    
    return Response.json(
      { 
        authenticated: false, 
        verified: false,
        error: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
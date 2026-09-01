import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const queryString = new URL(request.url).searchParams.toString();
  const endpoint = queryString
    ? `${API_BASE}/notifications?${queryString}`
    : `${API_BASE}/notifications`;

  const res = await fetch(endpoint, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

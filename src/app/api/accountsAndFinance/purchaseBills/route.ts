import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const url = new URL(request.url);
  const query = url.searchParams.toString();

  const res = await fetch(`${API_BASE}/purchase-bills${query ? `?${query}` : ''}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

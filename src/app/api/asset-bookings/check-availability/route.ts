import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const res = await fetch(`${API_BASE}/asset-bookings/check-availability?${searchParams.toString()}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

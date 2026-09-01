import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

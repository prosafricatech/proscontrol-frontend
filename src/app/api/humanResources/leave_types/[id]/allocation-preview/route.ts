import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const scope = req.nextUrl.searchParams.get('scope') || 'all';
  const gender = req.nextUrl.searchParams.get('gender');
  const startDate = req.nextUrl.searchParams.get('start_date');
  const query = new URLSearchParams({
    scope,
    ...(gender ? { gender } : {}),
    ...(startDate ? { start_date: startDate } : {}),
  });
  const res = await fetch(`${API_BASE}/leave-types/${id}/allocation-preview?${query.toString()}`, {
    method: 'GET',
    headers,
  });

  return handleJsonResponse(res);
}

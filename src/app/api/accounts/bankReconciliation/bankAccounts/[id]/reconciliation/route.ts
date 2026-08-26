import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();

  const res = await fetch(`${API_BASE}/accounts/bank-accounts/${id}/reconciliation?${query}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

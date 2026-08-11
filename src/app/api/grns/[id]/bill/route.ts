import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();
  const res = await fetch(`${API_BASE}/grns/${id}/bill`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res);
}

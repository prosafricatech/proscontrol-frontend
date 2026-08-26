import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; journalId: string }> }
) {
  const { id, journalId } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();
  const res = await fetch(`${API_BASE}/accounts/bank-accounts/${id}/journals/${journalId}/match-lines`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res);
}

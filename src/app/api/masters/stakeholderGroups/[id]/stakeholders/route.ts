import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

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

  const res = await fetch(`${API_BASE}/stakeholder-groups/${id}/stakeholders?${query}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();
  const res = await fetch(`${API_BASE}/stakeholder-groups/${id}/stakeholders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  return handleJsonResponse(res);
}

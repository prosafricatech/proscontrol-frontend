import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { id } = await params;

  const res = await fetch(`${API_BASE}/notifications/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

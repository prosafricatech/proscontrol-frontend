import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const formData = await req.formData();
  const proxyHeaders = new Headers(headers);
  proxyHeaders.delete('content-type');

  const res = await fetch(`${API_BASE}/assets/bulk-import`, {
    method: 'POST',
    headers: proxyHeaders,
    credentials: 'include',
    body: formData,
  });

  return handleJsonResponse(res);
}

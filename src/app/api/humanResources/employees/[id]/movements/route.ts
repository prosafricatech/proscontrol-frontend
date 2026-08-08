import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  // Map type to endpoint
  let endpoint: string;
  switch (type) {
    case 'cost_center':
      endpoint = `${API_BASE}/employees/${id}/cost-center-movements`;
      break;
    case 'department':
      endpoint = `${API_BASE}/employees/${id}/department-movements`;
      break;
    case 'manager':
      endpoint = `${API_BASE}/employees/${id}/manager-movements`;
      break;
    case 'all':
    default:
      endpoint = `${API_BASE}/employees/${id}/all-movements`;
      break;
  }

  const res = await fetch(endpoint, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}
import { getAuthHeaders } from '@/lib/utils/apiUtils';
import { handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const res = await fetch(`${API_BASE}/assets/reports/schedule?${searchParams.toString()}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}

export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();
  const res = await fetch(`${API_BASE}/assets/reports/schedule`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({ message: 'Failed to generate the asset schedule' }),
      { status: res.status }
    );
  }

  const blob = await res.arrayBuffer();

  return new Response(blob, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=Fixed Asset Schedule.xlsx',
    },
  });
}

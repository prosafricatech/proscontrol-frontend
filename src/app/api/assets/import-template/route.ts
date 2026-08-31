import { NextRequest } from 'next/server';
import { getAuthHeaders } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(`${API_BASE}/assets/import-template`, {
    method: 'POST',
    headers: {
      ...headers,
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  });

  if (!res.ok) {
    return new Response(
      JSON.stringify({ message: 'Failed to generate the import template' }),
      { status: res.status }
    );
  }

  const blob = await res.arrayBuffer();

  return new Response(blob, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=Asset Register Import Template.xlsx',
    },
  });
}

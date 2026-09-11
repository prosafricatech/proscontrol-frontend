import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL

export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const body = await req.json();

  const res = await fetch(`${API_BASE}/trial-balance-grouped`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const buffer = await res.arrayBuffer();
  return new Response(buffer, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": res.headers.get("content-disposition") || "",
    },
  });
}

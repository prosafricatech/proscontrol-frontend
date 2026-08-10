import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function GET(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const res = await fetch(
    `${API_BASE}/payroll-period-leave-encashments/daily-rate?${searchParams.toString()}`,
    {
      method: 'GET',
      headers,
    }
  );

  return handleJsonResponse(res);
}

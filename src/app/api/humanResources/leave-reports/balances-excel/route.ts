import { getAuthHeaders } from '@/lib/utils/apiUtils';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function POST(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const url = new URL(`${API_BASE}/leave-reports/balances-excel`);

  Array.from(searchParams.entries()).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers,
    credentials: 'include',
  });

  const blob = await res.blob();
  return new NextResponse(blob, {
    status: res.status,
    headers: {
      'Content-Type':
        res.headers.get('content-type') ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        res.headers.get('content-disposition') ||
        'attachment; filename="leave-balances.xlsx"',
    },
  });
}

import { getAuthHeaders } from '@/lib/utils/apiUtils';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function GET(req: NextRequest) {
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const search = req.nextUrl.search;
  const res = await fetch(`${API_BASE}/employees-export-excel${search}`, {
    method: 'GET',
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
        'attachment; filename="employees.xlsx"',
    },
  });
}

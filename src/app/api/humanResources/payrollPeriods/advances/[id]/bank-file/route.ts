import { getAuthHeaders } from '@/lib/utils/apiUtils';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const url = new URL(`${API_BASE}/payroll-periods/${id}/advances/bank-file`);
  const format = searchParams.get('format');
  if (format) url.searchParams.set('format', format);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    return NextResponse.json(await res.json().catch(() => ({})), {
      status: res.status,
    });
  }

  const blob = await res.blob();
  return new NextResponse(blob, {
    status: res.status,
    headers: {
      'Content-Type':
        res.headers.get('content-type') ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        res.headers.get('content-disposition') ||
        'attachment; filename="advance-bank-file.xlsx"',
    },
  });
}

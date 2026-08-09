import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(
    `${API_BASE}/payroll-periods/${id}/advances/transfer-sheet`,
    { headers, credentials: 'include' }
  );

  return handleJsonResponse(res);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { headers, response } = await getAuthHeaders(req);
  if (response) return response;

  const res = await fetch(
    `${API_BASE}/payroll-periods/${id}/advances/transfer-sheet-excel`,
    { method: 'POST', headers, credentials: 'include' }
  );

  const blob = await res.blob();
  return new NextResponse(blob, {
    status: res.status,
    headers: {
      'Content-Type':
        res.headers.get('content-type') ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        res.headers.get('content-disposition') ||
        'attachment; filename="advance-transfer-sheet.xlsx"',
    },
  });
}

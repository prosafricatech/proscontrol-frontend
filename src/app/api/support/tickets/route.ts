import { NextRequest, NextResponse } from 'next/server';
import { backendData, normalizeTicket, requestAllPages, requestBackend } from '@/lib/support/backend';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  query.delete('page');
  const queryString = query.toString();
  const result = await requestAllPages(request, `/tickets${queryString ? `?${queryString}` : ''}`);

  if (result instanceof NextResponse) return result;
  if (!result.ok) return NextResponse.json(result.payload, { status: result.response.status });

  return NextResponse.json({ data: result.items.map(normalizeTicket) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await requestBackend(request, '/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: body.subject,
      organization_name: body.organizationName,
      notes: body.description,
    }),
  });

  if (result instanceof NextResponse) return result;

  const ticket = backendData(result.payload)?.ticket;
  return NextResponse.json(
    result.response.ok ? { data: normalizeTicket(ticket), success: true } : result.payload,
    { status: result.response.status },
  );
}

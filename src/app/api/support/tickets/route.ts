import { NextRequest, NextResponse } from 'next/server';
import { backendData, normalizeTicket, requestBackend, ticketList } from '@/lib/support/backend';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const result = await requestBackend(request, `/tickets${query ? `?${query}` : ''}`);

  if (result instanceof NextResponse) return result;

  return NextResponse.json(
    result.response.ok ? { data: ticketList(result.payload) } : result.payload,
    { status: result.response.status },
  );
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

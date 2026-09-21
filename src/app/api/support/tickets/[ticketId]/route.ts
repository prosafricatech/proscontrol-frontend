import { NextRequest, NextResponse } from 'next/server';
import { backendData, normalizeTicket, requestBackend } from '@/lib/support/backend';

export async function GET(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const result = await requestBackend(request, `/tickets/${ticketId}`);

  if (result instanceof NextResponse) return result;

  const ticket = backendData(result.payload)?.ticket;
  return NextResponse.json(
    result.response.ok ? { data: normalizeTicket(ticket) } : result.payload,
    { status: result.response.status },
  );
}

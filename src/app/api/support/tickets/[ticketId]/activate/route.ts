import { NextRequest, NextResponse } from 'next/server';
import { backendData, normalizeTicket, requestBackend } from '@/lib/support/backend';

export async function POST(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const result = await requestBackend(request, `/tickets/${ticketId}/activate`, { method: 'POST' });

  if (result instanceof NextResponse) return result;

  const ticket = backendData(result.payload)?.ticket;
  return NextResponse.json(
    result.response.ok ? { data: normalizeTicket(ticket), success: true } : result.payload,
    { status: result.response.status },
  );
}

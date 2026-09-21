import { NextRequest, NextResponse } from 'next/server';
import { reassignTicket } from '@/lib/support/mockData';

export async function POST(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const body = await request.json();
  const ticket = reassignTicket(ticketId, body.owner ?? 'Unassigned');

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  return NextResponse.json({ data: ticket, success: true });
}

import { NextResponse } from 'next/server';
import { getSupportTicketById } from '@/lib/support/mockData';

export async function GET(_request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const ticket = getSupportTicketById(ticketId);

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  return NextResponse.json({ data: ticket });
}

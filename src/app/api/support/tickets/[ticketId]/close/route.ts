import { NextResponse } from 'next/server';
import { closeTicketById } from '@/lib/support/mockData';

export async function POST(_request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const ticket = closeTicketById(ticketId);

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  return NextResponse.json({ data: ticket, success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { addMessageToTicket } from '@/lib/support/mockData';

export async function POST(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const body = await request.json();
  const message = addMessageToTicket(ticketId, {
    senderId: body.senderId ?? 'system',
    senderName: body.senderName ?? 'Support',
    body: body.body ?? '',
  });

  if (!message) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  return NextResponse.json({ data: message, success: true }, { status: 201 });
}

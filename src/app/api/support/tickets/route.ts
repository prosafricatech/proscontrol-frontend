import { NextRequest, NextResponse } from 'next/server';
import {
  createTicketRecord,
  getSupportTickets,
} from '@/lib/support/mockData';

export async function GET() {
  return NextResponse.json({ data: getSupportTickets() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ticket = createTicketRecord({
      subject: body.subject ?? 'New support ticket',
      description: body.description ?? 'No description provided',
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      organizationId: body.organizationId ?? body.organization,
      organizationName: body.organizationName ?? body.organization,
      status: 'new',
    });

    return NextResponse.json({ data: ticket, success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to create ticket', details: String(error) }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { getSupportTickets } from '@/lib/support/mockData';

export async function GET() {
  const tickets = getSupportTickets().filter((ticket) => ticket.customerEmail === 'john.customer@proscontrol.com' || ticket.customerName === 'John Customer');
  return NextResponse.json({ data: tickets });
}

import { NextRequest, NextResponse } from 'next/server';
import { normalizeTicket, requestAllPages } from '@/lib/support/backend';

export async function GET(request: NextRequest) {
  const result = await requestAllPages(request, '/tickets');

  if (result instanceof NextResponse) return result;
  if (!result.ok) return NextResponse.json(result.payload, { status: result.response.status });

  const tickets = result.items.map(normalizeTicket);
  return NextResponse.json({
    data: {
      total: tickets.length,
      new: tickets.filter((ticket) => ticket.status === 'new').length,
      active: tickets.filter((ticket) => ticket.status === 'active').length,
      closed: tickets.filter((ticket) => ticket.status === 'closed').length,
      unassigned: tickets.filter((ticket) => !ticket.handledBy).length,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { normalizeReassignment, requestAllPages } from '@/lib/support/backend';

export async function GET(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const result = await requestAllPages(request, `/tickets/${ticketId}/reassignments`);

  if (result instanceof NextResponse) return result;
  if (!result.ok) return NextResponse.json(result.payload, { status: result.response.status });

  return NextResponse.json({ data: result.items.map(normalizeReassignment) });
}

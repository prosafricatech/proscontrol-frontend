import { NextRequest, NextResponse } from 'next/server';
import { requestBackend, ticketList } from '@/lib/support/backend';

export async function GET(request: NextRequest) {
  const result = await requestBackend(request, '/tickets?mine_only=1');

  if (result instanceof NextResponse) return result;

  return NextResponse.json(
    result.response.ok ? { data: ticketList(result.payload) } : result.payload,
    { status: result.response.status },
  );
}

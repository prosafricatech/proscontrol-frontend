import { NextRequest, NextResponse } from 'next/server';
import { normalizeTicket, requestAllPages } from '@/lib/support/backend';

export async function GET(request: NextRequest) {
  const result = await requestAllPages(request, '/tickets?mine_only=1');

  if (result instanceof NextResponse) return result;
  if (!result.ok) return NextResponse.json(result.payload, { status: result.response.status });

  return NextResponse.json({ data: result.items.map(normalizeTicket) });
}

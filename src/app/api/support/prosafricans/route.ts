import { requestBackend } from '@/lib/support/backend';
import { normalizeProsAfrican } from '@/lib/support/normalize';
import { NextRequest, NextResponse } from 'next/server';

/**
 * ProsAfricans (prosERP's internal team), for choosing who a ticket is
 * assigned to. Staff only. Query: `keyword`, `page`.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  for (const name of ['keyword', 'page']) {
    const value = params.get(name);
    if (value) {
      query.set(name, value);
    }
  }

  const queryString = query.toString();
  const result = await requestBackend(
    request,
    `/prosafricans${queryString ? `?${queryString}` : ''}`
  );

  if (result instanceof NextResponse) {
    return result;
  }
  if (!result.response.ok) {
    return NextResponse.json(result.payload, {
      status: result.response.status,
    });
  }

  const page = result.payload?.data ?? {};

  return NextResponse.json({
    data: (page.items ?? []).map(normalizeProsAfrican),
    meta: page.meta,
  });
}

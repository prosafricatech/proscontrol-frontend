import { NextRequest, NextResponse } from 'next/server';
import { requestPage } from '@/lib/support/backend';

const DAY_MS = 24 * 60 * 60 * 1000;
// Closed tickets are listed newest-created first, not by closed_at, so a ticket
// created long ago but closed recently can only be found by scanning back far
// enough. Tickets created before this lookback are not scanned.
const CLOSED_LOOKBACK_DAYS = 90;
// Safety cap per scan (15 tickets per backend page).
const MAX_PAGES = 40;

type ScanResult = { items: any[]; truncated: boolean } | NextResponse;

/**
 * Walk a newest-first ticket list until a page reaches tickets created before
 * `stopBefore` (or the list / page cap ends).
 */
async function scanUntil(request: NextRequest, path: string, stopBefore: number): Promise<ScanResult> {
  const items: any[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await requestPage(request, path, page);
    if (result instanceof NextResponse) return result;
    if (!result.ok) return NextResponse.json(result.payload, { status: result.response.status });

    items.push(...result.items);
    const reachedOlder = result.items.some((ticket: any) => new Date(ticket.created_at).getTime() < stopBefore);
    if (reachedOlder || page >= result.meta.last_page) return { items, truncated: false };
  }

  return { items, truncated: true };
}

/**
 * Report data built from the existing ticket list endpoints until the backend
 * offers a reports endpoint. Query: `from` (ISO date, start of the period).
 * Returns raw timestamps so the browser can bucket by the viewer's local day.
 */
export async function GET(request: NextRequest) {
  const fromParam = request.nextUrl.searchParams.get('from');
  const from = fromParam && !Number.isNaN(Date.parse(fromParam)) ? Date.parse(fromParam) : Date.now() - 7 * DAY_MS;

  const [opened, closed, fresh, active] = await Promise.all([
    scanUntil(request, '/tickets', from),
    scanUntil(request, '/tickets?status=closed', from - CLOSED_LOOKBACK_DAYS * DAY_MS),
    requestPage(request, '/tickets?status=new'),
    requestPage(request, '/tickets?status=active'),
  ]);

  for (const result of [opened, closed, fresh, active]) {
    if (result instanceof NextResponse) return result;
    if ('ok' in result && !result.ok) return NextResponse.json(result.payload, { status: result.response.status });
  }

  const openedScan = opened as Exclude<ScanResult, NextResponse>;
  const closedScan = closed as Exclude<ScanResult, NextResponse>;
  const count = (result: typeof fresh) => (result as Extract<typeof fresh, { ok: true }>).meta.total;

  return NextResponse.json({
    data: {
      from: new Date(from).toISOString(),
      openedAt: openedScan.items
        .map((ticket) => ticket.created_at)
        .filter((createdAt: string) => createdAt && Date.parse(createdAt) >= from),
      closedTickets: closedScan.items
        .filter((ticket) => ticket.closed_at && Date.parse(ticket.closed_at) >= from)
        .map((ticket) => ({
          createdAt: ticket.created_at,
          closedAt: ticket.closed_at,
          handledBy: ticket.attended_by?.name ?? null,
        })),
      backlog: { new: count(fresh), active: count(active) },
      closedLookbackDays: CLOSED_LOOKBACK_DAYS,
      truncated: openedScan.truncated || closedScan.truncated,
    },
  });
}

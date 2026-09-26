import { NextRequest, NextResponse } from 'next/server';
import { requestPage } from '@/lib/support/backend';

// Enough history for "last 7 days" in any timezone; the client buckets by local day.
const RECENT_WINDOW_MS = 8 * 24 * 60 * 60 * 1000;
// Safety cap on pages walked for the weekly chart (15 tickets per page).
const MAX_RECENT_PAGES = 20;

/**
 * Dashboard numbers without downloading every ticket: each count is the
 * `meta.total` of a one-page request. "Unassigned" equals `new`, because
 * activating a ticket is what assigns it.
 */
export async function GET(request: NextRequest) {
  const [all, fresh, active, closed, mine] = await Promise.all([
    requestPage(request, '/tickets'),
    requestPage(request, '/tickets?status=new'),
    requestPage(request, '/tickets?status=active'),
    requestPage(request, '/tickets?status=closed'),
    requestPage(request, '/tickets?mine_only=1'),
  ]);

  for (const result of [all, fresh, active, closed, mine]) {
    if (result instanceof NextResponse) return result;
    if (!result.ok) return NextResponse.json(result.payload, { status: result.response.status });
  }

  const ok = (result: typeof all) => result as Extract<typeof all, { ok: true }>;

  // Tickets come newest first, so stop at the first page that reaches past the window.
  const cutoff = Date.now() - RECENT_WINDOW_MS;
  const recentCreatedAt: string[] = [];
  let page = ok(all);
  for (let pageNumber = 1; pageNumber <= MAX_RECENT_PAGES; pageNumber += 1) {
    if (pageNumber > 1) {
      const next = await requestPage(request, '/tickets', pageNumber);
      if (next instanceof NextResponse || !next.ok) break;
      page = next;
    }

    const createdAts: string[] = page.items.map((ticket: any) => ticket.created_at).filter(Boolean);
    recentCreatedAt.push(...createdAts.filter((createdAt) => new Date(createdAt).getTime() >= cutoff));

    const reachedOlder = createdAts.some((createdAt) => new Date(createdAt).getTime() < cutoff);
    if (reachedOlder || pageNumber >= page.meta.last_page) break;
  }

  return NextResponse.json({
    data: {
      total: ok(all).meta.total,
      new: ok(fresh).meta.total,
      active: ok(active).meta.total,
      closed: ok(closed).meta.total,
      unassigned: ok(fresh).meta.total,
      mine: ok(mine).meta.total,
      recentCreatedAt,
    },
  });
}

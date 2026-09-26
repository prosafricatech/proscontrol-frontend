import { NextRequest, NextResponse } from 'next/server';
import { normalizeTicket, requestAllPages, requestPage, type PageMeta } from '@/lib/support/backend';

const PER_PAGE = 15;
const BACKEND_STATUSES = ['new', 'active', 'closed'];

/**
 * One page of tickets, filtered by the backend. Query: `status`
 * (new | active | closed | open), `mine_only`, `page`.
 *
 * `open` means new + active. The backend filters one status at a time, so
 * those two lists are merged here; it's only used for a customer's own open
 * tickets, which is always a small set.
 */
export async function listTickets(request: NextRequest, forceMineOnly = false) {
  const params = request.nextUrl.searchParams;
  const status = params.get('status');
  const page = Math.max(1, Number(params.get('page')) || 1);

  const query = new URLSearchParams();
  if (forceMineOnly || params.get('mine_only') === '1' || params.get('mine_only') === 'true') query.set('mine_only', '1');

  if (status === 'open') {
    const lists = await Promise.all(['new', 'active'].map((value) => {
      const statusQuery = new URLSearchParams(query);
      statusQuery.set('status', value);
      return requestAllPages(request, `/tickets?${statusQuery}`);
    }));

    for (const list of lists) {
      if (list instanceof NextResponse) return list;
      if (!list.ok) return NextResponse.json(list.payload, { status: list.response.status });
    }

    const all = lists
      .flatMap((list) => (list as { items: any[] }).items)
      .sort((a, b) => Number(b.id) - Number(a.id));
    const meta: PageMeta = {
      current_page: page,
      last_page: Math.max(1, Math.ceil(all.length / PER_PAGE)),
      per_page: PER_PAGE,
      total: all.length,
    };

    return NextResponse.json({ data: all.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(normalizeTicket), meta });
  }

  if (status && BACKEND_STATUSES.includes(status)) query.set('status', status);

  const queryString = query.toString();
  const result = await requestPage(request, `/tickets${queryString ? `?${queryString}` : ''}`, page);

  if (result instanceof NextResponse) return result;
  if (!result.ok) return NextResponse.json(result.payload, { status: result.response.status });

  return NextResponse.json({ data: result.items.map(normalizeTicket), meta: result.meta });
}

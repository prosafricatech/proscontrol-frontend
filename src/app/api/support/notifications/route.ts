import { NextRequest, NextResponse } from 'next/server';
import { backendData, requestBackend, requestPage } from '@/lib/support/backend';

const DAY_MS = 24 * 60 * 60 * 1000;
// Lifecycle events (activated / closed / assigned) older than this aren't shown.
const EVENT_WINDOW_MS = 14 * DAY_MS;
// Max tickets inspected for unread messages / assignment per request.
const MAX_TICKETS = 10;

export type SupportNotification = {
  id: string;
  kind: 'new_ticket' | 'assigned' | 'activated' | 'closed' | 'messages';
  title: string;
  detail: string;
  at: string;
  ticketId: string;
};

type BackendTicket = {
  id: number;
  subject?: string;
  status?: string;
  user?: { id?: number; name?: string } | null;
  attended_by?: { id?: number; name?: string } | null;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

const isRecent = (value?: string | null) => !!value && Date.now() - Date.parse(value) <= EVENT_WINDOW_MS;

/**
 * Unread messages from the other participant on one ticket. Only the newest
 * page is inspected (15 messages), which is enough to count "new" ones.
 */
async function unreadMessages(request: NextRequest, ticketId: number, meId: number) {
  const first = await requestPage(request, `/tickets/${ticketId}/messages`, 1);
  if (first instanceof NextResponse || !first.ok) return null;

  let items = first.items;
  if (first.meta.last_page > 1) {
    const last = await requestPage(request, `/tickets/${ticketId}/messages`, first.meta.last_page);
    if (last instanceof NextResponse || !last.ok) return null;
    items = last.items;
  }

  const unread = items.filter((message: any) => message.type !== 'system' && !message.read_at && message.sender?.id !== meId);
  if (unread.length === 0) return null;

  const latest = unread.at(-1);
  return { count: unread.length, capped: unread.length === items.length && first.meta.last_page > 1, latest };
}

function messagesNotification(ticket: BackendTicket, unread: NonNullable<Awaited<ReturnType<typeof unreadMessages>>>): SupportNotification {
  const count = unread.capped ? `${unread.count}+` : String(unread.count);
  const sender = unread.latest?.sender?.name ?? 'Someone';

  return {
    // Includes the newest unread id, so a later message re-notifies after "mark as read".
    id: `messages:${ticket.id}:${unread.latest?.id}`,
    kind: 'messages',
    title: `${count} new message${unread.count === 1 && !unread.capped ? '' : 's'} from ${sender}`,
    detail: ticket.subject ?? `Ticket #${ticket.id}`,
    at: unread.latest?.sent_at ?? unread.latest?.created_at ?? ticket.updated_at ?? '',
    ticketId: String(ticket.id),
  };
}

/**
 * Notifications derived from existing ticket/message data, until the backend
 * provides a notifications endpoint (see API contract, "Notifications module").
 */
export async function GET(request: NextRequest) {
  const meResult = await requestBackend(request, '/auth/me');
  if (meResult instanceof NextResponse) return meResult;
  if (!meResult.response.ok) return NextResponse.json(meResult.payload, { status: meResult.response.status });

  const me = backendData(meResult.payload)?.user;
  const meId = Number(me?.id);
  const items: SupportNotification[] = [];

  if (me?.is_staff === true) {
    const [waiting, mine] = await Promise.all([
      requestPage(request, '/tickets?status=new'),
      requestPage(request, '/tickets?mine_only=1&status=active'),
    ]);
    for (const result of [waiting, mine]) {
      if (result instanceof NextResponse) return result;
      if (!result.ok) return NextResponse.json(result.payload, { status: result.response.status });
    }

    for (const ticket of (waiting as Extract<typeof waiting, { ok: true }>).items as BackendTicket[]) {
      items.push({
        id: `new_ticket:${ticket.id}`,
        kind: 'new_ticket',
        title: 'New ticket waiting',
        detail: `${ticket.subject ?? `Ticket #${ticket.id}`} · ${ticket.user?.name ?? 'Customer'}`,
        at: ticket.created_at ?? '',
        ticketId: String(ticket.id),
      });
    }

    const myTickets = ((mine as Extract<typeof mine, { ok: true }>).items as BackendTicket[]).slice(0, MAX_TICKETS);
    await Promise.all(myTickets.map(async (ticket) => {
      const [unread, history] = await Promise.all([
        unreadMessages(request, ticket.id, meId),
        requestPage(request, `/tickets/${ticket.id}/reassignments`),
      ]);
      if (unread) items.push(messagesNotification(ticket, unread));

      // Newest reassignment first; skip when I assigned it to myself.
      const latest = !(history instanceof NextResponse) && history.ok ? history.items[0] : null;
      if (latest && latest.reassigned_by?.id !== meId && isRecent(latest.created_at)) {
        items.push({
          id: `assigned:${ticket.id}:${latest.id ?? latest.created_at}`,
          kind: 'assigned',
          title: `Ticket assigned to you by ${latest.reassigned_by?.name ?? 'a colleague'}`,
          detail: ticket.subject ?? `Ticket #${ticket.id}`,
          at: latest.created_at,
          ticketId: String(ticket.id),
        });
      }
    }));
  } else {
    const [active, closed] = await Promise.all([
      requestPage(request, '/tickets?status=active'),
      requestPage(request, '/tickets?status=closed'),
    ]);
    for (const result of [active, closed]) {
      if (result instanceof NextResponse) return result;
      if (!result.ok) return NextResponse.json(result.payload, { status: result.response.status });
    }

    const activeTickets = ((active as Extract<typeof active, { ok: true }>).items as BackendTicket[]).slice(0, MAX_TICKETS);
    await Promise.all(activeTickets.map(async (ticket) => {
      if (ticket.attended_by && isRecent(ticket.updated_at)) {
        items.push({
          // Includes the handler, so a reassignment shows up as a new notification.
          id: `activated:${ticket.id}:${ticket.attended_by.id}`,
          kind: 'activated',
          title: `${ticket.attended_by.name ?? 'Support'} is now handling your ticket`,
          detail: ticket.subject ?? `Ticket #${ticket.id}`,
          at: ticket.updated_at ?? '',
          ticketId: String(ticket.id),
        });
      }
      const unread = await unreadMessages(request, ticket.id, meId);
      if (unread) items.push(messagesNotification(ticket, unread));
    }));

    for (const ticket of (closed as Extract<typeof closed, { ok: true }>).items as BackendTicket[]) {
      if (!isRecent(ticket.closed_at)) continue;
      items.push({
        id: `closed:${ticket.id}`,
        kind: 'closed',
        title: 'Your ticket was closed',
        detail: ticket.subject ?? `Ticket #${ticket.id}`,
        at: ticket.closed_at ?? '',
        ticketId: String(ticket.id),
      });
    }
  }

  items.sort((a, b) => Date.parse(b.at || '0') - Date.parse(a.at || '0'));

  return NextResponse.json({ data: { items, isStaff: me?.is_staff === true } });
}

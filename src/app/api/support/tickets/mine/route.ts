import { NextRequest } from 'next/server';
import { listTickets } from '../_list';

/** Customers: their own tickets. Staff: tickets they're attending. */
export async function GET(request: NextRequest) {
  return listTickets(request, true);
}

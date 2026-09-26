import { NextRequest } from 'next/server';
import { forwardAuthRequest } from '../_backend';

export async function POST(req: NextRequest) {
  const body = await req.json();

  return forwardAuthRequest(req, '/auth/verify-email', { email: body.email, code: body.code });
}

import { NextRequest } from 'next/server';
import { forwardAuthRequest } from '../_backend';

/**
 * Guest sign up. The backend returns `{ user, verification_required }` and
 * sends a 6-digit code; the session is only created after verification,
 * when the client signs in with the same credentials.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  return forwardAuthRequest(req, '/auth/register', {
    name: body.name,
    email: body.email || null,
    phone: body.phone,
    password: body.password,
    password_confirmation: body.password_confirmation,
  });
}

import { requestBackend } from '@/lib/support/backend';
import { NextRequest, NextResponse } from 'next/server';

/**
 * The ProsAfrican's ProsControl account, created by the backend if they've
 * never signed in, so they can be assigned a ticket. Answers `{ data: { userId } }`.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proserpUserId: string }> }
) {
  const { proserpUserId } = await params;
  const result = await requestBackend(
    request,
    `/prosafricans/${encodeURIComponent(proserpUserId)}/enroll`,
    { method: 'POST' }
  );

  if (result instanceof NextResponse) {
    return result;
  }
  if (!result.response.ok) {
    return NextResponse.json(result.payload, {
      status: result.response.status,
    });
  }

  const userId = result.payload?.data?.user?.id;

  return NextResponse.json({
    data: { userId: userId ? String(userId) : null },
  });
}

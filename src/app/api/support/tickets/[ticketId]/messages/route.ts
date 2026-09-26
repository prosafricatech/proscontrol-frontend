import { NextRequest, NextResponse } from 'next/server';
import { backendData, normalizeMessage, requestAllPages, requestBackend } from '@/lib/support/backend';

/**
 * Full thread, or only messages newer than `after_id` when polling.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const afterId = request.nextUrl.searchParams.get('after_id');
  const query = afterId ? `?after_id=${encodeURIComponent(afterId)}` : '';
  const result = await requestAllPages(request, `/tickets/${ticketId}/messages${query}`);

  if (result instanceof NextResponse) return result;
  if (!result.ok) return NextResponse.json(result.payload, { status: result.response.status });

  return NextResponse.json({ data: result.items.map(normalizeMessage) });
}

/**
 * Expects multipart form data: `body` plus optional `attachments[]` files,
 * forwarded to Laravel unchanged.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const formData = await request.formData();
  const result = await requestBackend(request, `/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: formData,
  });

  if (result instanceof NextResponse) return result;

  const { response, payload } = result;

  if (!response.ok) {
    // An oversized upload is rejected by PHP/the web server before Laravel
    // runs, so there is no JSON envelope to relay.
    const fallback = {
      code: response.status,
      message: response.status === 413 ? 'The attachments are too large to upload.' : 'Unable to send message.',
      data: null,
    };
    return NextResponse.json(payload ?? fallback, { status: response.status });
  }

  return NextResponse.json({ data: normalizeMessage(backendData(payload)?.message), success: true });
}

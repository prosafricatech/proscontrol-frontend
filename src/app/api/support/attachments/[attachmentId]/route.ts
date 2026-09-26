import { NextRequest, NextResponse } from 'next/server';
import { fetchBackend } from '@/lib/support/backend';

/**
 * Streams the file through so the browser never needs the Bearer token.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ attachmentId: string }> }) {
  const { attachmentId } = await params;
  const backendResponse = await fetchBackend(request, `/attachments/${attachmentId}`);

  if (backendResponse instanceof NextResponse) return backendResponse;

  if (!backendResponse.ok) {
    const payload = await backendResponse.json().catch(() => ({ message: 'Unable to download attachment' }));
    return NextResponse.json(payload, { status: backendResponse.status });
  }

  const headers = new Headers();
  ['content-type', 'content-length', 'content-disposition'].forEach((name) => {
    const value = backendResponse.headers.get(name);
    if (value) headers.set(name, value);
  });

  return new NextResponse(backendResponse.body, { status: 200, headers });
}

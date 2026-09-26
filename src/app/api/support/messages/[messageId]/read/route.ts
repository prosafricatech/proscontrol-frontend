import { NextRequest, NextResponse } from 'next/server';
import { backendData, normalizeMessage, requestBackend } from '@/lib/support/backend';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params;
  const result = await requestBackend(request, `/messages/${messageId}/read`, { method: 'PATCH' });

  if (result instanceof NextResponse) return result;

  const message = backendData(result.payload)?.message;
  return NextResponse.json(
    result.response.ok ? { data: normalizeMessage(message), success: true } : result.payload,
    { status: result.response.status },
  );
}

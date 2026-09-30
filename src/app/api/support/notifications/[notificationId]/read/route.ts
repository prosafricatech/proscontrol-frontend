import {
  backendData,
  normalizeNotification,
  requestBackend,
} from '@/lib/support/backend';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const { notificationId } = await params;
  const result = await requestBackend(
    request,
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: 'PATCH' }
  );

  if (result instanceof NextResponse) {
    return result;
  }
  if (!result.response.ok) {
    return NextResponse.json(result.payload, {
      status: result.response.status,
    });
  }

  const notification = backendData(result.payload)?.notification;
  return NextResponse.json({ data: normalizeNotification(notification) });
}

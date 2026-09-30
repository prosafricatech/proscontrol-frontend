import { requestBackend } from '@/lib/support/backend';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  const result = await requestBackend(request, '/notifications/read-all', {
    method: 'PATCH',
  });

  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result.payload, { status: result.response.status });
}

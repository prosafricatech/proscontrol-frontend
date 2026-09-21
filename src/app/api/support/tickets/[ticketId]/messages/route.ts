import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Messaging is not available in the backend API yet' },
    { status: 501 },
  );
}

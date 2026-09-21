import { NextResponse } from 'next/server';
import { getSupportStats } from '@/lib/support/mockData';

export async function GET() {
  return NextResponse.json({ data: getSupportStats() });
}

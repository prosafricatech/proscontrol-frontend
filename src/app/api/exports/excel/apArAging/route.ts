import { exportApArAgingToExcel } from '@/lib/excel/exporters/apArAging';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;

    const buffer = await exportApArAgingToExcel(body);

    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ap-ar-aging-report.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error in API route:', error);
    return new Response(
      JSON.stringify({
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

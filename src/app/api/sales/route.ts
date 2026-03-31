import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// GET sales for the web UI
export async function GET() {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sales = await prisma.sale.findMany({
      where: { storeId },
      orderBy: { invoiceDate: 'desc' },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

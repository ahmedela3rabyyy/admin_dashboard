import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch returns with original sale and product details
    const returns = await (prisma as any).saleReturn.findMany({
      where: { storeId },
      include: {
        sale: {
           select: { id: true, invoiceDate: true, finalAmount: true }
        },
        items: {
          include: {
            product: {
              select: { name: true }
            }
          }
        },
        shift: {
           include: {
              user: { select: { fullName: true } }
           }
        }
      },
      orderBy: { returnDate: 'desc' },
      take: limit
    });

    return NextResponse.json(returns);
  } catch (error: any) {
    console.error('API /api/returns Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { productIds, saleIds, expenseIds } = body;
    
    let deletedCount = 0;

    // Remove products no longer in Desktop (but protect web-added ones)
    if (Array.isArray(productIds)) {
      const result = await prisma.product.deleteMany({
        where: {
          storeId,
          id: { notIn: productIds },
          isSynced: true, // Only delete synced products, keep web-added (isSynced=false)
        }
      });
      deletedCount += result.count;
    }

    // Remove sales no longer in Desktop
    if (Array.isArray(saleIds)) {
      const result = await prisma.sale.deleteMany({
        where: {
          storeId,
          id: { notIn: saleIds }
        }
      });
      deletedCount += result.count;
    }

    // Remove expenses no longer in Desktop
    if (Array.isArray(expenseIds)) {
      const result = await prisma.expense.deleteMany({
        where: {
          storeId,
          id: { notIn: expenseIds }
        }
      });
      deletedCount += result.count;
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error: any) {
    console.error('API /sync/cleanup Error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

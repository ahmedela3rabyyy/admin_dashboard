import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// GET supplier ledger
export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const supplierId = parseInt(searchParams.get('id') || '0');
    if (!supplierId) return NextResponse.json({ error: 'Supplier ID required' }, { status: 400 });

    const transactions = await prisma.supplierTransaction.findMany({
      where: { storeId, supplierId },
      orderBy: { date: 'asc' },
    });

    // Calculate running balance
    let runningBalance = 0;
    const ledger = transactions.map(t => {
      if (t.transType === 'INVOICE') runningBalance += t.amount;
      else if (t.transType === 'PAYMENT') runningBalance -= t.amount;
      return { ...t, runningBalance };
    }).reverse();

    return NextResponse.json(ledger);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const suppliers = await prisma.storeSupplier.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
    
    const enriched = [];
    for (const sup of suppliers) {
      const invoices = await prisma.supplierTransaction.aggregate({
        where: { storeId, supplierId: sup.id, transType: 'INVOICE' },
        _sum: { amount: true },
      });
      const payments = await prisma.supplierTransaction.aggregate({
        where: { storeId, supplierId: sup.id, transType: 'PAYMENT' },
        _sum: { amount: true },
      });
      enriched.push({
        ...sup,
        debt: (invoices._sum.amount || 0) - (payments._sum.amount || 0),
      });
    }

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

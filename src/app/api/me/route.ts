import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const stats = {
      products: await prisma.product.count({ where: { storeId } }),
      sales: await prisma.sale.count({ where: { storeId } }),
      expenses: await prisma.expense.count({ where: { storeId } }),
      employees: await prisma.employee.count({ where: { storeId } }),
      suppliers: await prisma.storeSupplier.count({ where: { storeId } }),
    };

    return NextResponse.json({ store, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

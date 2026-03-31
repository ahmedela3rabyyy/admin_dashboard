import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const employees = await prisma.employee.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
    
    // Get advance balance for each employee
    const enriched = [];
    for (const emp of employees) {
      const advances = await prisma.advance.aggregate({
        where: { storeId, employeeId: emp.id, isDeducted: false },
        _sum: { amount: true },
      });
      enriched.push({
        ...emp,
        advanceBalance: advances._sum.amount || 0,
      });
    }

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

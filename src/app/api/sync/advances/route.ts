import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Sync advances from desktop
export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { advances } = await req.json();
    let count = 0;
    for (const a of advances) {
      await prisma.advance.upsert({
        where: { storeId_id: { storeId, id: a.id } },
        update: { employeeId: a.employee_id, amount: a.amount, isDeducted: !!a.is_deducted, notes: a.notes || null, isSynced: true },
        create: { id: a.id, storeId, employeeId: a.employee_id, amount: a.amount, date: a.date ? new Date(a.date) : new Date(), isDeducted: !!a.is_deducted, notes: a.notes || null, isSynced: true },
      });
      count++;
    }
    return NextResponse.json({ success: true, synced: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    const deviceId = req.headers.get('x-device-id') || null; // ✅ هوية الجهاز
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { expenses } = body;

    if (!expenses || !Array.isArray(expenses)) {
      return NextResponse.json({ error: 'Expenses data must be an array' }, { status: 400 });
    }

    let syncedCount = 0;

    for (const exp of expenses) {
      const incomingDeviceId = exp.device_id || deviceId;
      await prisma.expense.upsert({
        where: { storeId_id: { storeId, id: exp.id } },
        update: {
          title: exp.title,
          amount: exp.amount,
          expenseType: exp.expense_type,
          beneficiary: exp.beneficiary,
          expenseDate: new Date(exp.expense_date || new Date()),
          notes: exp.notes,
          deviceId: incomingDeviceId, // ✅
        },
        create: {
          id: exp.id,
          storeId,
          title: exp.title,
          amount: exp.amount,
          expenseType: exp.expense_type,
          beneficiary: exp.beneficiary,
          expenseDate: new Date(exp.expense_date || new Date()),
          notes: exp.notes,
          isSynced: true,
          deviceId: incomingDeviceId, // ✅
        }
      });
      syncedCount++;
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error('API /sync/expenses Error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

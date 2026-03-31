import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Sync supplier transactions from desktop
export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    const deviceId = req.headers.get('x-device-id') || null;
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { transactions } = await req.json();
    let count = 0;
    for (const t of transactions) {
      await prisma.supplierTransaction.upsert({
        where: { storeId_id: { storeId, id: t.id } },
        update: { supplierId: t.supplier_id, transType: t.trans_type, amount: t.amount, notes: t.notes || null, attachmentPath: t.attachment_path || null, isSynced: true, deviceId },
        create: { id: t.id, storeId, supplierId: t.supplier_id, transType: t.trans_type, amount: t.amount, date: t.date ? new Date(t.date) : new Date(), notes: t.notes || null, attachmentPath: t.attachment_path || null, isSynced: true, deviceId },
      });
      count++;
    }
    return NextResponse.json({ success: true, synced: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

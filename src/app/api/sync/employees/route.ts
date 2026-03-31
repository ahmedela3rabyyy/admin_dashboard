import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Sync employees from desktop
export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { employees } = await req.json();
    let count = 0;
    for (const e of employees) {
      await prisma.employee.upsert({
        where: { storeId_id: { storeId, id: e.id } },
        update: { name: e.name, phone: e.phone || null, salary: e.salary || 0, isSynced: true },
        create: { id: e.id, storeId, name: e.name, phone: e.phone || null, salary: e.salary || 0, isSynced: true },
      });
      count++;
    }
    return NextResponse.json({ success: true, synced: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

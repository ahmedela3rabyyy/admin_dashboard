import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Sync suppliers from desktop
export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    const deviceId = req.headers.get('x-device-id') || null;
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { suppliers } = await req.json();
    let count = 0;
    for (const s of suppliers) {
      await prisma.storeSupplier.upsert({
        where: { storeId_id: { storeId, id: s.id } },
        update: { name: s.name, phone: s.phone || null, address: s.address || null, notes: s.notes || null, isSynced: true, deviceId },
        create: { id: s.id, storeId, name: s.name, phone: s.phone || null, address: s.address || null, notes: s.notes || null, isSynced: true, deviceId },
      });
      count++;
    }
    return NextResponse.json({ success: true, synced: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

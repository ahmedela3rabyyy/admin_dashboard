import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    const deviceId = req.headers.get('x-device-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { shifts } = body;

    if (!shifts || !Array.isArray(shifts)) {
      return NextResponse.json({ error: 'Shifts data must be an array' }, { status: 400 });
    }

    let syncedCount = 0;

    // ✅ ضمان وجود الـ Store
    await prisma.store.upsert({
      where: { id: storeId },
      update: {},
      create: { id: storeId, name: 'المتجر', email: `${storeId}@sync.local`, password: 'auto-sync' }
    });

    for (const s of shifts) {
      try {
        await prisma.shift.upsert({
          where: { storeId_id: { storeId, id: s.id } },
            update: {
              userId: s.userId,
              startTime: new Date(s.startTime),
              endTime: s.endTime ? new Date(s.endTime) : null,
              startCash: s.startCash,
              totalSales: s.totalSales,
              totalExpenses: s.totalExpenses,
              netCash: s.netCash,
              actualCash: s.actualCash,
              notes: s.notes,
              salesCount: s.salesCount || 0, // ✅ NEW
              deviceId: s.deviceId || deviceId,
            },
            create: {
              id: s.id,
              storeId,
              userId: s.userId,
              startTime: new Date(s.startTime),
              endTime: s.endTime ? new Date(s.endTime) : null,
              startCash: s.startCash,
              totalSales: s.totalSales,
              totalExpenses: s.totalExpenses,
              netCash: s.netCash,
              actualCash: s.actualCash,
              notes: s.notes,
              salesCount: s.salesCount || 0, // ✅ NEW
              deviceId: s.deviceId || deviceId,
            }
        });
        syncedCount++;
      } catch (e) {
        console.error(`[Shifts Sync] Error syncing shift ${s.id}:`, e);
      }
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error('API /sync/shifts Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

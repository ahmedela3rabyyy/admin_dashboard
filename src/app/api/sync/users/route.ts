import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    const deviceId = req.headers.get('x-device-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { users } = body;

    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Users data must be an array' }, { status: 400 });
    }

    let syncedCount = 0;

    // ✅ ضمان وجود الـ Store
    await prisma.store.upsert({
      where: { id: storeId },
      update: {},
      create: { id: storeId, name: 'المتجر', email: `${storeId}@sync.local`, password: 'auto-sync' }
    });

    for (const u of users) {
      try {
        await prisma.appUser.upsert({
          where: { storeId_id: { storeId, id: u.id } },
          update: {
            username: u.username,
            fullName: u.fullName,
            role: u.role,
            isActive: u.isActive,
            deviceId: u.deviceId || deviceId,
          },
          create: {
            id: u.id,
            storeId,
            username: u.username,
            fullName: u.fullName,
            role: u.role,
            isActive: u.isActive,
            deviceId: u.deviceId || deviceId,
          }
        });
        syncedCount++;
      } catch (e) {
        console.error(`[Users Sync] Error syncing user ${u.id}:`, e);
      }
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error('API /sync/users Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

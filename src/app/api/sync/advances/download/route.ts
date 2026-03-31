import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    const deviceId = req.headers.get('x-device-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const where: any = { storeId };
    if (deviceId) {
      where.deviceId = { not: deviceId };
    }

    const advances = await prisma.advance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ advances });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

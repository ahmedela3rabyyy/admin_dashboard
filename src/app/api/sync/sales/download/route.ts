import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — يُرجع المبيعات من الأجهزة الأخرى فقط (يستثني مبيعات الجهاز الطالب)
export async function GET(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    const deviceId = req.headers.get('x-device-id'); // هوية الجهاز الطالب
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // نجلب كل المبيعات ما عدا اللي أنشأها هذا الجهاز نفسه
    // لو deviceId موجود: نستثني مبيعاته
    // لو مش موجود: نرجع الكل
    const where: any = { storeId };
    if (deviceId) {
      where.deviceId = { not: deviceId };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: true, // items بدون product join لتسريع الاستجابة
      },
      orderBy: { invoiceDate: 'desc' },
      take: 1000,
    });

    return NextResponse.json({ sales });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

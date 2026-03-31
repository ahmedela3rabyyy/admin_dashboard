import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — يُرجع كميات المخزون الحالية من السحابة كـ source of truth
export async function GET(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const products = await prisma.product.findMany({
      where: { storeId },
      select: { id: true, stockQuantity: true, name: true },
    });

    return NextResponse.json({ stock: products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

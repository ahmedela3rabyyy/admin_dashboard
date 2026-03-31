import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Desktop calls this to download products from cloud
export async function GET(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fullSync = searchParams.get('full') === '1';

    // full=1 → جهاز جديد / مزامنة كاملة → ينزّل كل المنتجات
    // بدون full → ينزّل بس المنتجات المضافة من الويب فقط
    const products = await prisma.product.findMany({
      where: fullSync
        ? { storeId }                         // كل المنتجات
        : { storeId, isSynced: false },        // الويب فقط
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Desktop confirms it downloaded the products
export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { productIds } = await req.json();

    if (Array.isArray(productIds) && productIds.length > 0) {
      for (const id of productIds) {
        await prisma.product.update({
          where: { storeId_id: { storeId, id } },
          data: { isSynced: true },
        });
      }
    }

    return NextResponse.json({ success: true, confirmed: productIds?.length || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

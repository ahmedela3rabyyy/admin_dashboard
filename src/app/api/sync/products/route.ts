import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const products = await prisma.product.findMany({ where: { storeId } });
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    const deviceId = req.headers.get('x-device-id') || null;
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { products } = body;
    
    if (!products || !Array.isArray(products)) {
        return NextResponse.json({ error: 'Products data must be an array' }, { status: 400 });
    }

    // ✅ ضمان وجود الـ Store قبل أي عملية (يحل مشكلة إعادة deploy على Railway)
    await prisma.store.upsert({
      where: { id: storeId },
      update: {},
      create: {
        id: storeId,
        name: 'المتجر',
        email: `${storeId}@sync.local`,
        password: 'auto-sync'
      }
    });

    let syncedCount = 0;

    for (const prod of products) {
      try {
        await prisma.product.upsert({
          where: { storeId_id: { storeId, id: prod.id } },
          update: {
            name: prod.name,
            category: prod.category,
            barcode: prod.barcode || null,
            description: prod.description,
            buyPrice: prod.buy_price || 0.0,
            sellPrice: prod.sell_price || 0.0,
            stockQuantity: prod.stock_quantity || 0,
            minStockLevel: prod.min_stock_level || 5,
            unit: prod.unit,
            location: prod.location,
            largeUnit: prod.large_unit,
            piecesPerUnit: prod.pieces_per_unit || 1,
            largeSellPrice: prod.large_sell_price || 0.0,
            allowLargeSale: prod.allow_large_sale ?? 1,
            updatedAt: new Date(),
            deviceId: prod.device_id || deviceId,
          },
          create: {
            id: prod.id,
            storeId: storeId,
            name: prod.name,
            category: prod.category,
            barcode: prod.barcode || null,
            description: prod.description,
            buyPrice: prod.buy_price || 0.0,
            sellPrice: prod.sell_price || 0.0,
            stockQuantity: prod.stock_quantity || 0,
            minStockLevel: prod.min_stock_level || 5,
            unit: prod.unit,
            location: prod.location,
            largeUnit: prod.large_unit,
            piecesPerUnit: prod.pieces_per_unit || 1,
            largeSellPrice: prod.large_sell_price || 0.0,
            allowPieceSale: prod.allow_piece_sale ?? 1,
            allowLargeSale: prod.allow_large_sale ?? 1,
            createdAt: new Date(prod.created_at || Date.now()),
            updatedAt: new Date(prod.updated_at || Date.now()),
            isSynced: true,
            deviceId: prod.device_id || deviceId,
          }
        });
        syncedCount++;
      } catch (prodError: any) {
        console.error(`[Products Sync] ⚠️ Skipped product ${prod.id}: ${prodError.message?.slice(0, 100)}`);
      }
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error('API /sync/products Error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// GET all products
export async function GET() {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const products = await prisma.product.findMany({ where: { storeId }, orderBy: { name: 'asc' } });
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE product
export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();

    const maxProduct = await prisma.product.findFirst({ where: { storeId }, orderBy: { id: 'desc' } });
    const nextId = maxProduct ? Math.max(maxProduct.id + 1, 900000) : 900000;

    const product = await prisma.product.create({
      data: {
        id: nextId, storeId, name: body.name, category: body.category || null,
        barcode: body.barcode || null, description: body.description || null,
        buyPrice: parseFloat(body.buyPrice) || 0, sellPrice: parseFloat(body.sellPrice) || 0,
        stockQuantity: parseInt(body.stockQuantity) || 0, minStockLevel: parseInt(body.minStockLevel) || 5,
        unit: body.unit || 'قطعة', location: body.location || null,
        largeUnit: body.largeUnit || null, piecesPerUnit: parseInt(body.piecesPerUnit) || 1,
        largeSellPrice: parseFloat(body.largeSellPrice) || 0,
        allowPieceSale: body.allowPieceSale ?? 1, allowLargeSale: body.allowLargeSale ?? 1,
        isSynced: false,
      }
    });
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE product
export async function PUT(req: Request) {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const id = parseInt(body.id);
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const product = await prisma.product.update({
      where: { storeId_id: { storeId, id } },
      data: {
        name: body.name, category: body.category || null,
        barcode: body.barcode || null, description: body.description || null,
        buyPrice: parseFloat(body.buyPrice) || 0, sellPrice: parseFloat(body.sellPrice) || 0,
        stockQuantity: parseInt(body.stockQuantity) || 0, minStockLevel: parseInt(body.minStockLevel) || 5,
        unit: body.unit || 'قطعة', location: body.location || null,
        largeUnit: body.largeUnit || null, piecesPerUnit: parseInt(body.piecesPerUnit) || 1,
        largeSellPrice: parseFloat(body.largeSellPrice) || 0,
        allowPieceSale: body.allowPieceSale ?? 1, allowLargeSale: body.allowLargeSale ?? 1,
        isSynced: false, // Mark unsynced so desktop picks up changes
        updatedAt: new Date(),
      }
    });
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(req: Request) {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '0');
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    await prisma.product.delete({ where: { storeId_id: { storeId, id } } });

    // Track deletion for desktop reverse sync
    await prisma.webDeletion.create({
      data: { storeId, tableName: 'products', recordId: id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

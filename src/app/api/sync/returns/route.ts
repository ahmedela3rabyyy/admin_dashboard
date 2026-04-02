import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    const deviceId = req.headers.get('x-device-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { returns } = body;

    if (!returns || !Array.isArray(returns)) {
      return NextResponse.json({ error: 'Returns data must be an array' }, { status: 400 });
    }

    let syncedCount = 0;
    const errors: any[] = [];

    await prisma.store.upsert({
      where: { id: storeId },
      update: {},
      create: { id: storeId, name: 'المتجر', email: `${storeId}@sync.local`, password: 'auto-sync' }
    });

    for (const r of returns) {
      try {
        await prisma.$transaction(async (tx) => {
          // 0. التأكد من وجود الفاتورة الأصلية (Sale) لتجنب خطأ Foreign Key
          // إذا لم تكن موجودة بعد (بسبب تأخر المزامنة)، نقوم بإنشاء سجل فارغ لها
          await (tx as any).sale.upsert({
            where: { storeId_id: { storeId, id: r.sale_id } },
            update: {},
            create: {
              id: r.sale_id,
              storeId,
              invoiceDate: new Date(r.return_date),
              totalAmount: 0,
              finalAmount: 0,
              isSynced: false, // سنتركها غير مزامنة ليتم تحديثها لاحقاً بالبيانات الحقيقية
              deviceId: r.device_id || deviceId
            }
          });

          // 1. التحقق مما إذا كان المرتجع موجوداً مسبقاً (لتجنب تكرار زيادة المخزون)
          const existingReturn = await (tx as any).saleReturn.findUnique({
            where: { storeId_id: { storeId, id: r.id } }
          });

          // 2. مزامنة بيانات المرتجع (Header)
          await (tx as any).saleReturn.upsert({
            where: { storeId_id: { storeId, id: r.id } },
            update: {
              saleId: r.sale_id,
              shiftId: r.shift_id,
              totalRefund: r.total_refund,
              returnDate: new Date(r.return_date),
              deviceId: r.device_id || deviceId,
            },
            create: {
              id: r.id,
              storeId,
              saleId: r.sale_id,
              shiftId: r.shift_id,
              totalRefund: r.total_refund,
              returnDate: new Date(r.return_date),
              deviceId: r.device_id || deviceId,
            }
          });

          // 3. إذا كان المرتجع جديداً، قم بتحديث المخزون ومزامنة الأصناف
          if (!existingReturn && r.items && Array.isArray(r.items)) {
            for (const item of r.items) {
              // ضمان وجود المنتج (Product) لتجنب خطأ Foreign Key
              await (tx as any).product.upsert({
                where: { storeId_id: { storeId, id: item.product_id } },
                update: {},
                create: {
                  id: item.product_id,
                  storeId,
                  name: `منتج #${item.product_id}`,
                  sellPrice: item.unit_sell_price_at_sale,
                  buyPrice: 0,
                  stockQuantity: 0,
                  category: 'غير مصنف'
                }
              });

              // محاولة إيجاد رقم المنتج في الفاتورة الأصلية للربط
              const saleItem = await (tx as any).saleItem.findFirst({
                where: { saleId: r.sale_id, productId: item.product_id, storeId }
              });

              // إضافة الصنف
              await (tx as any).saleReturnItem.create({
                data: {
                  returnId: r.id,
                  storeId,
                  productId: item.product_id,
                  saleItemId: saleItem?.id || null, // الربط الديناميكي
                  quantity: item.quantity,
                  unitSellPriceAtSale: item.unit_sell_price_at_sale,
                  refundAmount: item.refund_amount
                }
              });

              // زيادة المخزون
              await (tx as any).product.update({
                where: { storeId_id: { storeId, id: item.product_id } },
                data: { stockQuantity: { increment: item.quantity } }
              });
            }
          }
        });
        syncedCount++;
      } catch (e: any) {
        console.error(`[Returns Sync] Error syncing return ${r.id}:`, e);
        errors.push({ id: r.id, error: e.message });
      }
    }

    return NextResponse.json({ success: true, count: syncedCount, errorDetails: errors });
  } catch (error: any) {
    console.error('API /sync/returns Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

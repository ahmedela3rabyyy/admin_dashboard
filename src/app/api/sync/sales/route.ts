import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    const deviceId = req.headers.get('x-device-id') || null; // ✅ هوية الجهاز
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { sales } = body;

    if (!sales || !Array.isArray(sales)) {
      return NextResponse.json({ error: 'Sales data must be an array' }, { status: 400 });
    }

    let syncedCount = 0;

    for (const sale of sales) {
      const incomingDeviceId = sale.device_id || deviceId;
      await prisma.sale.upsert({
        where: { storeId_id: { storeId, id: sale.id } },
        update: {
          totalAmount: sale.total_amount,
          discount: sale.discount || 0.0,
          finalAmount: sale.final_amount,
          paymentMethod: sale.payment_method || 'CASH',
          notes: sale.notes,
          invoiceDate: new Date(sale.invoice_date || new Date()),
          deviceId: incomingDeviceId, // ✅  
        },
        create: {
          id: sale.id,
          storeId,
          totalAmount: sale.total_amount,
          discount: sale.discount || 0.0,
          finalAmount: sale.final_amount,
          paymentMethod: sale.payment_method || 'CASH',
          notes: sale.notes,
          invoiceDate: new Date(sale.invoice_date || new Date()),
          isSynced: true,
          deviceId: incomingDeviceId, // ✅
          items: {
            create: sale.items.map((item: any) => ({
              productId: item.product_id,
              quantity: item.quantity,
              unitBuyPriceAtSale: item.unit_buy_price_at_sale,
              unitSellPriceAtSale: item.unit_sell_price_at_sale,
              discountAmount: item.discount_amount || 0.0,
              totalPrice: item.total_price,
            }))
          }
        }
      });
      syncedCount++;
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error('API /sync/sales Error:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

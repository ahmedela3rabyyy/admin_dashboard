import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifications: { id: string; type: string; severity: 'info' | 'warning' | 'danger' | 'success'; title: string; message: string; }[] = [];

    // Low stock alerts
    const lowStock = await prisma.product.findMany({
      where: { storeId, stockQuantity: { lte: 5 } },
      orderBy: { stockQuantity: 'asc' },
      take: 20,
    });
    for (const p of lowStock) {
      notifications.push({
        id: `low-${p.id}`,
        type: 'stock',
        severity: p.stockQuantity === 0 ? 'danger' : 'warning',
        title: p.stockQuantity === 0 ? `⛔ نفد المخزون: ${p.name}` : `⚠️ مخزون منخفض: ${p.name}`,
        message: p.stockQuantity === 0 ? 'هذا المنتج نفد تماماً من المخزون!' : `متبقي ${p.stockQuantity} ${p.unit || 'قطعة'} فقط (الحد الأدنى: ${p.minStockLevel})`,
      });
    }

    // Stale products (no sales in last 7 days)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const allProducts = await prisma.product.findMany({ where: { storeId }, select: { id: true, name: true } });
    const recentSaleItems = await prisma.saleItem.findMany({
      where: { storeId, sale: { invoiceDate: { gte: weekAgo } } },
      select: { productId: true },
    });
    const recentlySellingIds = new Set(recentSaleItems.map(i => i.productId));
    const staleProducts = allProducts.filter(p => !recentlySellingIds.has(p.id));
    if (staleProducts.length > 0 && allProducts.length > 0) {
      notifications.push({
        id: 'stale-products',
        type: 'insight',
        severity: 'info',
        title: `📦 ${staleProducts.length} منتج لم يُبع منذ أسبوع`,
        message: staleProducts.slice(0, 5).map(p => p.name).join('، ') + (staleProducts.length > 5 ? ` و${staleProducts.length - 5} آخرين` : ''),
      });
    }

    // Today's achievement
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todaySales = await prisma.sale.aggregate({
      where: { storeId, invoiceDate: { gte: todayStart } },
      _sum: { finalAmount: true }, _count: true,
    });
    const todayRevenue = todaySales._sum.finalAmount || 0;
    const todayCount = todaySales._count || 0;
    if (todayRevenue > 0) {
      notifications.push({
        id: 'daily-achievement',
        type: 'achievement',
        severity: 'success',
        title: `🎯 إنجاز اليوم: ${todayRevenue.toFixed(2)} ج.م`,
        message: `تم بيع ${todayCount} فاتورة اليوم بإجمالي ${todayRevenue.toFixed(2)} ج.م`,
      });
    }

    // High profit product insight
    const products = await prisma.product.findMany({ where: { storeId } });
    const highProfit = products.filter(p => p.sellPrice > 0 && ((p.sellPrice - p.buyPrice) / p.buyPrice) > 0.5).slice(0, 3);
    if (highProfit.length > 0) {
      notifications.push({
        id: 'high-profit',
        type: 'insight',
        severity: 'success',
        title: `💎 منتجات ذات هامش ربح عالي`,
        message: highProfit.map(p => `${p.name} (${(((p.sellPrice - p.buyPrice) / p.buyPrice) * 100).toFixed(0)}%)`).join('، '),
      });
    }

    return NextResponse.json({ notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

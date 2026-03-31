import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const storeId = req.headers.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Sales by day (last 7 days)
    const last7Days: { date: string; revenue: number; cost: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart); dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      
      const daySales = await prisma.sale.findMany({
        where: { storeId, invoiceDate: { gte: dayStart, lt: dayEnd } },
        include: { items: true }
      });
      
      const revenue = daySales.reduce((s, sale) => s + sale.finalAmount, 0);
      const cost = daySales.reduce((s, sale) => s + sale.items.reduce((si, item) => si + (item.unitBuyPriceAtSale * item.quantity), 0), 0);
      
      last7Days.push({
        date: dayStart.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }),
        revenue: +revenue.toFixed(2),
        cost: +cost.toFixed(2),
        count: daySales.length,
      });
    }

    // Top selling products
    const allSaleItems = await prisma.saleItem.findMany({
      where: { storeId },
      include: { product: true },
    });

    const productSalesMap: Record<string, { name: string; qty: number; revenue: number; profit: number }> = {};
    for (const item of allSaleItems) {
      const key = `${item.productId}`;
      if (!productSalesMap[key]) {
        productSalesMap[key] = { name: item.product?.name || `#${item.productId}`, qty: 0, revenue: 0, profit: 0 };
      }
      productSalesMap[key].qty += item.quantity;
      productSalesMap[key].revenue += item.totalPrice;
      productSalesMap[key].profit += (item.unitSellPriceAtSale - item.unitBuyPriceAtSale) * item.quantity;
    }
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Today stats
    const todaySales = await prisma.sale.aggregate({
      where: { storeId, invoiceDate: { gte: todayStart } },
      _sum: { finalAmount: true }, _count: true
    });
    const todayExpenses = await prisma.expense.aggregate({
      where: { storeId, expenseDate: { gte: todayStart } },
      _sum: { amount: true }
    });

    // Monthly stats
    const monthSales = await prisma.sale.aggregate({
      where: { storeId, invoiceDate: { gte: monthStart } },
      _sum: { finalAmount: true }, _count: true
    });
    const monthExpenses = await prisma.expense.aggregate({
      where: { storeId, expenseDate: { gte: monthStart } },
      _sum: { amount: true }
    });

    // Inventory value
    const products = await prisma.product.findMany({ where: { storeId } });
    const inventoryBuyValue = products.reduce((s, p) => s + (p.buyPrice * p.stockQuantity), 0);
    const inventorySellValue = products.reduce((s, p) => s + (p.sellPrice * p.stockQuantity), 0);
    const totalProductCount = products.length;
    const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel);

    // Category distribution
    const categoryMap: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category || 'بدون تصنيف';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }
    const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      last7Days,
      topProducts,
      today: {
        revenue: todaySales._sum.finalAmount || 0,
        expenses: todayExpenses._sum.amount || 0,
        salesCount: todaySales._count || 0,
        profit: (todaySales._sum.finalAmount || 0) - (todayExpenses._sum.amount || 0),
      },
      month: {
        revenue: monthSales._sum.finalAmount || 0,
        expenses: monthExpenses._sum.amount || 0,
        salesCount: monthSales._count || 0,
        profit: (monthSales._sum.finalAmount || 0) - (monthExpenses._sum.amount || 0),
      },
      inventory: {
        buyValue: +inventoryBuyValue.toFixed(2),
        sellValue: +inventorySellValue.toFixed(2),
        potentialProfit: +(inventorySellValue - inventoryBuyValue).toFixed(2),
        totalProducts: totalProductCount,
        lowStockCount: lowStockProducts.length,
      },
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

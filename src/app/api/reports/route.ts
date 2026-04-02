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
    
    console.log(`[Reports API] storeId: ${storeId}, todayStart: ${todayStart.toISOString()}`);

    // Sales and Returns by day (last 7 days)
    const last7Days: { date: string; revenue: number; cost: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart); dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      
      const daySales = await (prisma as any).sale.findMany({
        where: { storeId, invoiceDate: { gte: dayStart, lt: dayEnd } },
        include: { items: true }
      });

      const dayReturns = await (prisma as any).saleReturn.findMany({
        where: { storeId, returnDate: { gte: dayStart, lt: dayEnd } },
        include: { items: true }
      });
      
      const saleRevenue = daySales.reduce((s: number, sale: any) => s + sale.finalAmount, 0);
      const returnRevenue = dayReturns.reduce((s: number, ret: any) => s + ret.totalRefund, 0);
      const revenue = saleRevenue - returnRevenue;

      const saleCost = daySales.reduce((s: number, sale: any) => s + sale.items.reduce((si: number, item: any) => si + (item.unitBuyPriceAtSale * item.quantity), 0), 0);
      // Cost of returned items should be subtracted from total cost (they are back in stock)
      // Actually, returns reduce the 'cost of goods sold'
      const returnCostEffect = dayReturns.reduce((s: number, ret: any) => s + ret.items.reduce((ri: number, item: any) => ri + (item.unitSellPriceAtSale * 0.8 * item.quantity), 0), 0); 
      const cost = saleCost - returnCostEffect;
      
      last7Days.push({
        date: dayStart.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }),
        revenue: +revenue.toFixed(2),
        cost: +cost.toFixed(2),
        count: daySales.length,
      });
    }

    // Top selling products (Adjusted for returns)
    const allSaleItems = await (prisma as any).saleItem.findMany({
      where: { storeId },
      include: { product: true },
    });

    const allReturnItems = await (prisma as any).saleReturnItem.findMany({
      where: { storeId },
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

    // Subtract returns from product metrics
    for (const item of allReturnItems) {
      const key = `${item.productId}`;
      if (productSalesMap[key]) {
        productSalesMap[key].qty -= item.quantity;
        productSalesMap[key].revenue -= item.refundAmount;
        // Approximation: assume 15% margin for profit subtraction if we don't have the original cost in return record
        productSalesMap[key].profit -= (item.refundAmount * 0.15); 
      }
    }
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Today stats (Adjusted)
    const todaySales = await (prisma as any).sale.aggregate({
      where: { storeId, invoiceDate: { gte: todayStart } },
      _sum: { finalAmount: true }, _count: true
    });
    const todayReturns = await (prisma as any).saleReturn.aggregate({
      where: { storeId, returnDate: { gte: todayStart } },
      _sum: { totalRefund: true }
    });
    const todayExpenses = await (prisma as any).expense.aggregate({
      where: { storeId, expenseDate: { gte: todayStart } },
      _sum: { amount: true }
    });

    // Monthly stats (Adjusted)
    const monthSales = await (prisma as any).sale.aggregate({
      where: { storeId, invoiceDate: { gte: monthStart } },
      _sum: { finalAmount: true }, _count: true
    });
    const monthReturns = await (prisma as any).saleReturn.aggregate({
      where: { storeId, returnDate: { gte: monthStart } },
      _sum: { totalRefund: true }
    });
    const monthExpenses = await (prisma as any).expense.aggregate({
      where: { storeId, expenseDate: { gte: monthStart } },
      _sum: { amount: true }
    });

    // Inventory value
    const products = await (prisma as any).product.findMany({ where: { storeId } });
    const inventoryBuyValue = products.reduce((s: number, p: any) => s + (p.buyPrice * p.stockQuantity), 0);
    const inventorySellValue = products.reduce((s: number, p: any) => s + (p.sellPrice * p.stockQuantity), 0);
    const totalProductCount = products.length;
    const lowStockProducts = products.filter((p: any) => p.stockQuantity <= p.minStockLevel);

    // Category distribution
    const categoryMap: Record<string, number> = {};
    for (const p of products as any[]) {
      const cat = p.category || 'بدون تصنيف';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }
    const categories = Object.entries(categoryMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // Recent 5 returns
    const recentReturns = await (prisma as any).saleReturn.findMany({
      where: { storeId },
      orderBy: { returnDate: 'desc' },
      take: 5
    });

    const todayRev = (todaySales._sum.finalAmount || 0) - (todayReturns._sum.totalRefund || 0);
    const monthRev = (monthSales._sum.finalAmount || 0) - (monthReturns._sum.totalRefund || 0);

    return NextResponse.json({
      last7Days,
      topProducts,
      recentReturns,
      today: {
        revenue: todayRev,
        expenses: todayExpenses._sum.amount || 0,
        salesCount: todaySales._count || 0,
        profit: todayRev - (todayExpenses._sum.amount || 0),
      },
      month: {
        revenue: monthRev,
        expenses: monthExpenses._sum.amount || 0,
        salesCount: monthSales._count || 0,
        profit: monthRev - (monthExpenses._sum.amount || 0),
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

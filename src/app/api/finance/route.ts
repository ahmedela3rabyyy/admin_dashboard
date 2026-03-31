import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// ============================================================
// This is a read-only mirror of the finance data.
// Since employees, suppliers, advances, and supplier_transactions 
// are NOT in the Prisma schema (they're managed locally),
// we expose the data through the desktop sync.
//
// For now, we provide what Prisma HAS: expenses + sales summary.
// ============================================================

export async function GET() {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Today's sales
    const todaySales = await prisma.sale.aggregate({
      where: { storeId, invoiceDate: { gte: todayStart } },
      _sum: { finalAmount: true },
    });

    // Today's expenses (excluding CASH_IN type if present)
    const todayExpenses = await prisma.expense.findMany({
      where: { storeId, expenseDate: { gte: todayStart } },
      orderBy: { expenseDate: 'desc' },
    });

    const cashIns = todayExpenses.filter(e => e.expenseType === 'CASH_IN');
    const regularExpenses = todayExpenses.filter(e => e.expenseType !== 'CASH_IN');

    const salesTotal = todaySales._sum.finalAmount || 0;
    const cashInTotal = cashIns.reduce((s, e) => s + e.amount, 0);
    const expensesTotal = regularExpenses.reduce((s, e) => s + e.amount, 0);
    const netDrawer = salesTotal + cashInTotal - expensesTotal;

    // All expenses (for full list)
    const allExpenses = await prisma.expense.findMany({
      where: { storeId },
      orderBy: { expenseDate: 'desc' },
      take: 200,
    });

    // Monthly summary
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthSales = await prisma.sale.aggregate({
      where: { storeId, invoiceDate: { gte: monthStart } },
      _sum: { finalAmount: true },
    });
    const monthExpenses = await prisma.expense.aggregate({
      where: { storeId, expenseDate: { gte: monthStart }, expenseType: { not: 'CASH_IN' } },
      _sum: { amount: true },
    });

    // Expense categories breakdown
    const categoryBreakdown: Record<string, number> = {};
    for (const exp of allExpenses) {
      const cat = exp.expenseType || 'أخرى';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + exp.amount;
    }
    const categories = Object.entries(categoryBreakdown)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      today: {
        sales: salesTotal,
        cashIn: cashInTotal,
        expenses: expensesTotal,
        netDrawer,
      },
      month: {
        sales: monthSales._sum.finalAmount || 0,
        expenses: monthExpenses._sum.amount || 0,
      },
      todayExpenses: todayExpenses,
      allExpenses: allExpenses,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add expense from web
export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const storeId = headersList.get('x-store-id');
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const maxExpense = await prisma.expense.findFirst({
      where: { storeId },
      orderBy: { id: 'desc' },
    });
    const nextId = maxExpense ? Math.max(maxExpense.id + 1, 800000) : 800000;

    const expense = await prisma.expense.create({
      data: {
        id: nextId,
        storeId,
        title: body.title || `${body.category} - ${body.details || ''}`,
        amount: parseFloat(body.amount) || 0,
        expenseType: body.category || body.expenseType || 'أخرى',
        beneficiary: body.beneficiary || null,
        notes: body.details || body.notes || null,
        isSynced: false,
      }
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

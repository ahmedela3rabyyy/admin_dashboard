import prisma from "@/lib/prisma";
import { Package, Receipt, Activity, TrendingUp, DollarSign, ArrowUpLeft, ArrowDownLeft, Wallet, Clock, Key, CheckCircle, Copy } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const headersList = await headers();
  const storeId = headersList.get('x-store-id');
  if (!storeId) return null;

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true, createdAt: true } });

  const sales = await prisma.sale.findMany({
    where: { storeId },
    orderBy: { invoiceDate: 'desc' },
    take: 7,
    include: { items: { include: { product: true } } }
  });

  const totalSalesAgg = await prisma.sale.aggregate({ where: { storeId }, _sum: { finalAmount: true }, _count: true });
  const totalProducts = await prisma.product.count({ where: { storeId } });
  const lowStockProducts = await prisma.product.count({ where: { storeId, stockQuantity: { lte: 5 } } });
  const totalExpensesAgg = await prisma.expense.aggregate({ where: { storeId }, _sum: { amount: true } });

  const totalRevenue = totalSalesAgg._sum.finalAmount || 0;
  const totalExpenses = totalExpensesAgg._sum.amount || 0;
  const netProfit = totalRevenue - totalExpenses;
  const totalSalesCount = totalSalesAgg._count || 0;
  const hasSyncedData = totalProducts > 0 || totalSalesCount > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">مرحباً، {store?.name || 'مدير النظام'} 👋</h2>
          <p className="text-slate-400 mt-1">ملخص شامل لأداء مكتبتك اليوم</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
          <Clock className="h-3 w-3" />
          آخر تحديث: {new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* API Key Banner - Only show if no data synced yet */}
      {!hasSyncedData && (
        <div className="bg-gradient-to-l from-blue-500/5 to-slate-900 border border-blue-500/20 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Key className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-1">مفتاح الربط لتطبيق الويندوز (Store API Key)</p>
              <p className="text-blue-400 font-mono text-xs select-all bg-slate-950 inline-block px-3 py-1 rounded-lg border border-slate-800">{storeId}</p>
            </div>
          </div>
          <div className="text-xs bg-blue-500/10 text-blue-300 px-4 py-2 rounded-xl border border-blue-500/20 hidden sm:block">
            الصقه في نافذة الإعدادات ببرنامج المكتبة
          </div>
        </div>
      )}

      {/* Sync Success Banner */}
      {hasSyncedData && (
        <div className="bg-gradient-to-l from-emerald-500/5 to-slate-900 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <p className="text-emerald-300 text-sm font-medium">المزامنة تعمل بنجاح! يتم تحديث البيانات تلقائياً كل 15 ثانية.</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-row items-center justify-between pb-2 relative z-10">
            <h3 className="text-sm font-medium text-slate-400">إجمالي الإيرادات</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg"><DollarSign className="h-5 w-5 text-blue-500" /></div>
          </div>
          <div className="text-3xl font-bold text-white relative z-10 mt-1">{totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1 relative z-10">ج.م — من {totalSalesCount} فاتورة</p>
        </div>

        {/* Products */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-row items-center justify-between pb-2 relative z-10">
            <h3 className="text-sm font-medium text-slate-400">عدد المنتجات</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><Package className="h-5 w-5 text-emerald-500" /></div>
          </div>
          <div className="text-3xl font-bold text-white relative z-10 mt-1">{totalProducts}</div>
          {lowStockProducts > 0 && (
            <p className="text-xs text-amber-400 mt-1 relative z-10">⚠ {lowStockProducts} منتج مخزونه منخفض</p>
          )}
        </div>

        {/* Expenses */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-row items-center justify-between pb-2 relative z-10">
            <h3 className="text-sm font-medium text-slate-400">إجمالي المصروفات</h3>
            <div className="p-2 bg-rose-500/10 rounded-lg"><ArrowDownLeft className="h-5 w-5 text-rose-500" /></div>
          </div>
          <div className="text-3xl font-bold text-white relative z-10 mt-1">{totalExpenses.toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1 relative z-10">ج.م</p>
        </div>

        {/* Net Profit */}
        <div className={`rounded-2xl border p-6 shadow-xl relative overflow-hidden group transition-all ${netProfit >= 0 ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 to-slate-900' : 'border-rose-500/30 bg-gradient-to-br from-rose-950/50 to-slate-900'}`}>
          <div className="flex flex-row items-center justify-between pb-2 relative z-10">
            <h3 className="text-sm font-medium text-slate-400">صافي الربح</h3>
            <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <Wallet className={`h-5 w-5 ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
            </div>
          </div>
          <div className={`text-3xl font-bold relative z-10 mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}
          </div>
          <p className="text-xs text-slate-500 mt-1 relative z-10">ج.م</p>
        </div>
      </div>

      {/* Recent Sales & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sales */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            أحدث الفواتير
          </h3>
          <div className="space-y-3">
            {sales.map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between border border-slate-800/50 bg-slate-800/20 p-4 rounded-xl hover:bg-slate-800/40 transition-colors group">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">#{sale.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sale.paymentMethod === 'CASH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {sale.paymentMethod === 'CASH' ? 'كاش' : sale.paymentMethod}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{new Date(sale.invoiceDate).toLocaleString('ar-EG')}</p>
                  <p className="text-[11px] text-slate-600 truncate max-w-[250px]">
                    {sale.items.map((i: any) => i.product?.name).filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="font-bold text-lg text-emerald-400">{sale.finalAmount.toFixed(2)} <span className="text-xs text-slate-500">ج.م</span></div>
              </div>
            ))}
            {sales.length === 0 && (
              <div className="text-center py-12 bg-slate-800/10 rounded-xl border border-dashed border-slate-700">
                <Receipt className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500">لم يتم مزامنة أي مبيعات بعد.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            إجراءات سريعة
          </h3>
          <div className="space-y-3">
            <Link href="/products" className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-all group">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform"><Package className="h-5 w-5 text-blue-400" /></div>
              <div><p className="text-sm font-medium text-white">إدارة المنتجات</p><p className="text-xs text-slate-500">إضافة وعرض ومتابعة المخزون</p></div>
            </Link>
            <Link href="/sales" className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all group">
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform"><Receipt className="h-5 w-5 text-emerald-400" /></div>
              <div><p className="text-sm font-medium text-white">سجل المبيعات</p><p className="text-xs text-slate-500">تفاصيل جميع الفواتير</p></div>
            </Link>
            <Link href="/reports" className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 transition-all group">
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:scale-110 transition-transform"><TrendingUp className="h-5 w-5 text-purple-400" /></div>
              <div><p className="text-sm font-medium text-white">التقارير والإحصائيات</p><p className="text-xs text-slate-500">تحليل الأداء والأرباح</p></div>
            </Link>
            <Link href="/settings" className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-800 hover:bg-slate-800 transition-all group">
              <div className="p-2 bg-slate-700/50 rounded-lg group-hover:scale-110 transition-transform"><Key className="h-5 w-5 text-slate-400" /></div>
              <div><p className="text-sm font-medium text-white">الإعدادات</p><p className="text-xs text-slate-500">مفتاح الربط والمعلومات</p></div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

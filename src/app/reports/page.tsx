'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Package, DollarSign, ShoppingBag, Calendar, ArrowUpLeft, ArrowDownLeft, Wallet, PieChart, Award } from 'lucide-react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!data) return null;

  const maxRevenue = Math.max(...data.last7Days.map((d: any) => d.revenue), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">التقارير والإحصائيات</h2>
        <p className="text-slate-400 mt-1">تحليل شامل لأداء مكتبتك</p>
      </div>

      {/* Today vs Month Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today */}
        <div className="bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2"><Calendar className="h-5 w-5" />ملخص اليوم</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <ArrowUpLeft className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{data.today.revenue.toFixed(2)}</p>
              <p className="text-xs text-slate-500">إيرادات (ج.م)</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <ArrowDownLeft className="h-5 w-5 text-rose-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{data.today.expenses.toFixed(2)}</p>
              <p className="text-xs text-slate-500">مصروفات (ج.م)</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <ShoppingBag className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{data.today.salesCount}</p>
              <p className="text-xs text-slate-500">فاتورة</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${data.today.profit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <Wallet className={`h-5 w-5 mx-auto mb-1 ${data.today.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
              <p className={`text-2xl font-bold ${data.today.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{data.today.profit.toFixed(2)}</p>
              <p className="text-xs text-slate-500">صافي الربح</p>
            </div>
          </div>
        </div>

        {/* Month */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5" />ملخص الشهر</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <ArrowUpLeft className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{data.month.revenue.toFixed(2)}</p>
              <p className="text-xs text-slate-500">إيرادات (ج.م)</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <ArrowDownLeft className="h-5 w-5 text-rose-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{data.month.expenses.toFixed(2)}</p>
              <p className="text-xs text-slate-500">مصروفات (ج.م)</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 text-center">
              <ShoppingBag className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{data.month.salesCount}</p>
              <p className="text-xs text-slate-500">فاتورة</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${data.month.profit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <Wallet className={`h-5 w-5 mx-auto mb-1 ${data.month.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
              <p className={`text-2xl font-bold ${data.month.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{data.month.profit.toFixed(2)}</p>
              <p className="text-xs text-slate-500">صافي الربح</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart (Last 7 Days) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
          المبيعات خلال آخر 7 أيام
        </h3>
        <div className="flex items-end gap-3 h-48">
          {data.last7Days.map((day: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center gap-1">
                <span className="text-xs text-emerald-400 font-bold">{day.revenue > 0 ? day.revenue.toFixed(0) : ''}</span>
                <div className="w-full flex gap-0.5 justify-center" style={{ height: `${Math.max((day.revenue / maxRevenue) * 140, 4)}px` }}>
                  <div className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md max-w-8 transition-all hover:from-blue-500 hover:to-blue-300" style={{ height: '100%' }}></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-500">{day.date}</p>
                <p className="text-[10px] text-slate-600">{day.count} فاتورة</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
            <Award className="h-5 w-5 text-amber-400" />
            أكثر المنتجات مبيعاً
          </h3>
          <div className="space-y-3">
            {data.topProducts.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد بيانات مبيعات بعد</p>}
            {data.topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-white font-medium truncate">{p.name}</p>
                    <p className="text-xs text-emerald-400 font-bold mr-2">{p.revenue.toFixed(2)} ج.م</p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${(p.revenue / (data.topProducts[0]?.revenue || 1)) * 100}%` }}></div>
                  </div>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{p.qty} قطعة</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory & Categories */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-950/30 to-slate-900 border border-purple-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2"><Package className="h-5 w-5" />تقرير الجرد وقيمة المخزون</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-white">{data.inventory.totalProducts}</p>
                <p className="text-[11px] text-slate-500">منتج مسجل</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-400">{data.inventory.lowStockCount}</p>
                <p className="text-[11px] text-slate-500">مخزون منخفض</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-300">{data.inventory.buyValue.toFixed(0)}</p>
                <p className="text-[11px] text-slate-500">قيمة الشراء (ج.م)</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{data.inventory.sellValue.toFixed(0)}</p>
                <p className="text-[11px] text-slate-500">قيمة البيع (ج.م)</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <p className="text-xs text-slate-400">الأرباح المتوقعة من المخزون الحالي</p>
              <p className="text-2xl font-bold text-emerald-400">{data.inventory.potentialProfit.toFixed(2)} ج.م</p>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><PieChart className="h-4 w-4 text-blue-400" />توزيع التصنيفات</h3>
            <div className="space-y-2">
              {data.categories.map((c: any, i: number) => {
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-cyan-500'];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`}></div>
                    <span className="text-sm text-slate-300 flex-1">{c.name}</span>
                    <span className="text-sm text-slate-500 font-mono">{c.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

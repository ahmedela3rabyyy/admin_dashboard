'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users2, Search, Calendar, Clock, DollarSign, ArrowUpRight, 
  ArrowDownRight, AlertCircle, CheckCircle2, ChevronRight,
  TrendingDown, TrendingUp, UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';

interface Shift {
  id: number;
  startTime: string;
  endTime: string | null;
  startCash: number;
  totalSales: number;
  totalExpenses: number;
  netCash: number;
  actualCash: number | null;
  notes: string | null;
  salesCount: number; // ✅ NEW
  user: {
    fullName: string;
    username: string;
    role: string;
  };
  sales?: { // ✅ NEW
    id: number;
    totalAmount: number;
    finalAmount: number;
    paymentMethod: string;
    invoiceDate: string;
  }[];
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedShift, setExpandedShift] = useState<number | null>(null); // ✅ NEW

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/shifts');
      if (res.ok) setShifts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const filtered = shifts.filter(s =>
    s.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">يوميات الموظفين</h2>
          <p className="text-slate-400">تقارير الورديات وتقفيل الخزينة وتفاصيل الفواتير</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث باسم الموظف..."
              className="pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-400">جاري تحميل تقارير الورديات...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
            <Users2 className="h-12 w-12 text-slate-700 mb-4" />
            <p className="text-slate-500">لا توجد تقارير ورديات حالياً</p>
          </div>
        ) : (
          filtered.map(shift => {
            const diff = shift.actualCash !== null ? (shift.actualCash - shift.netCash) : 0;
            const hasDiscrepancy = Math.abs(diff) > 0.1;
            const isFinished = !!shift.endTime;
            const isExpanded = expandedShift === shift.id;

            return (
              <div 
                key={shift.id} 
                className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    {/* User Profile */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <UserCheck size={28} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{shift.user.fullName}</h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            {shift.user.role === 'ADMIN' ? 'مدير' : 'كاشير'}
                          </span>
                          <span className="text-slate-500 font-mono">@{shift.user.username}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-300">
                          {new Date(shift.startTime).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-amber-400" />
                        <span className="text-slate-400">
                          {new Date(shift.startTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          {isFinished ? ` ➔ ${new Date(shift.endTime!).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}` : ' (قيد العمل حالياً)'}
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary Cards */}
                    <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
                      <div className="px-4 py-2 bg-slate-950/50 rounded-xl border border-slate-800/50">
                        <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-tighter">عدد الفواتير</p>
                        <p className="text-sm font-bold text-blue-400">{shift.salesCount || 0}</p>
                      </div>
                      <div className="px-4 py-2 bg-slate-950/50 rounded-xl border border-slate-800/50">
                        <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-tighter">المبيعات</p>
                        <p className="text-sm font-bold text-emerald-400">+{shift.totalSales.toFixed(2)}</p>
                      </div>
                      <div className="px-4 py-2 bg-slate-950/50 rounded-xl border border-slate-800/50">
                        <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-tighter">المصاريف</p>
                        <p className="text-sm font-bold text-rose-400">-{shift.totalExpenses.toFixed(2)}</p>
                      </div>
                      <div className={clsx(
                        "px-6 py-2 rounded-xl border flex flex-col items-center",
                        !isFinished ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                      )}>
                        <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-tighter">صافي الخزينة</p>
                        <p className={clsx("text-lg font-black", !isFinished ? "text-amber-400" : "text-emerald-400")}>
                          {shift.netCash.toFixed(2)} ج.م
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Discrepancy Alert */}
                  {isFinished && (
                    <div className={clsx(
                      "mt-6 p-4 rounded-2xl flex items-center justify-between gap-4 border",
                      hasDiscrepancy 
                        ? (diff > 0 ? "bg-amber-500/5 border-amber-500/20" : "bg-rose-500/5 border-rose-500/20")
                        : "bg-emerald-500/5 border-emerald-500/20"
                    )}>
                      <div className="flex items-center gap-3">
                        {hasDiscrepancy ? (
                          <AlertCircle size={24} className={diff > 0 ? "text-amber-400" : "text-rose-400"} />
                        ) : (
                          <CheckCircle2 size={24} className="text-emerald-400" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-white">
                            {hasDiscrepancy 
                              ? `تنبيه: يوجد ${diff > 0 ? 'زيادة' : 'عجز'} في الخزينة`
                              : "تم تقفيل اليومية بنجاح ومطابقة العجز/الزيادة"}
                          </p>
                          <p className="text-xs text-slate-400">
                            المبلغ الفعلي المستلم: <span className="font-bold text-white">{shift.actualCash?.toFixed(2)} ج.م</span>
                          </p>
                        </div>
                      </div>
                      
                      {hasDiscrepancy && (
                        <div className={clsx(
                          "px-4 py-1.5 rounded-full text-xs font-black shadow-sm",
                          diff > 0 ? "bg-amber-500 text-amber-950" : "bg-rose-500 text-rose-950"
                        )}>
                          {diff > 0 ? <TrendingUp className="inline-block mr-1 h-3.5 w-3.5" /> : <TrendingDown className="inline-block mr-1 h-3.5 w-3.5" />}
                          {Math.abs(diff).toFixed(2)} {diff > 0 ? 'زيادة' : 'عجز'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions / Invoice Toggle */}
                  <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                    {shift.notes ? (
                        <p className="text-xs text-slate-500 max-w-lg truncate italic">
                           <span className="font-bold text-slate-400 non-italic">ملاحظات:</span> {shift.notes}
                        </p>
                    ) : <div />}
                    
                    <button 
                      onClick={() => setExpandedShift(isExpanded ? null : shift.id)}
                      className={clsx(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                        isExpanded ? "bg-white text-slate-900" : "bg-slate-800 text-white hover:bg-slate-700"
                      )}
                    >
                      {isExpanded ? 'إخفاء العمليات' : 'عرض تفاصيل الفواتير'}
                      <ChevronRight className={clsx("h-4 w-4 transition-transform", isExpanded ? "rotate-90" : "")} />
                    </button>
                  </div>

                  {/* Invoice Details List */}
                  {isExpanded && shift.sales && (
                    <div className="mt-6 animate-in slide-in-from-top-4 duration-300">
                      <div className="bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden">
                        <table className="w-full text-right">
                          <thead className="bg-slate-900/50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                            <tr>
                              <th className="px-6 py-3">رقم الفاتورة</th>
                              <th className="px-6 py-3">الوقت</th>
                              <th className="px-6 py-3">طريقة الدفع</th>
                              <th className="px-6 py-3 text-left">المبلغ الصافي</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-slate-800/50">
                            {shift.sales.length > 0 ? shift.sales.map(sale => (
                              <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-mono text-blue-400">#{sale.id}</td>
                                <td className="px-6 py-4 text-slate-400 text-xs">
                                  {new Date(sale.invoiceDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={clsx(
                                    "px-2 py-1 rounded-md text-[10px] font-bold",
                                    sale.paymentMethod === 'CASH' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                                  )}>
                                    {sale.paymentMethod === 'CASH' ? 'كاش' : 'فيزا/محفظة'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-left font-bold text-white">{sale.finalAmount.toFixed(2)} ج.م</td>
                              </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">لا توجد مبيعات مسجلة في هذه الوردية</td>
                                </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users2, Search, Calendar, Clock, DollarSign, ArrowUpRight, 
  ArrowDownRight, AlertCircle, CheckCircle2, ChevronRight,
  TrendingDown, TrendingUp, UserCheck, FileText, X, Printer, Eye
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
  salesCount: number;
  user: {
    fullName: string;
    username: string;
    role: string;
  };
  sales?: {
    id: number;
    totalAmount: number;
    finalAmount: number;
    paymentMethod: string;
    invoiceDate: string;
    items: {
      quantity: number;
      totalPrice: number;
      product: { name: string };
    }[];
    returns: {
        id: number;
        totalRefund: number;
        returnDate: string;
    }[];
  }[];
  expenses?: {
    id: number;
    title: string;
    amount: number;
    expenseType: string;
    expenseDate: string;
  }[];
  saleReturns?: {
    id: number;
    totalRefund: number;
    returnDate: string;
    sale?: { id: number };
  }[];
}

const ReceiptModal = ({ sale, onClose }: { sale: any; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">تفاصيل الفاتورة #{sale.id}</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
      </div>
      <div className="space-y-4">
        {sale.items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-slate-300">{item.product.name} x{item.quantity}</span>
            <span className="text-white font-mono">{item.totalPrice.toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-slate-800 pt-4 flex justify-between font-bold text-lg">
          <span className="text-slate-400">الإجمالي</span>
          <span className="text-emerald-400">{sale.finalAmount.toFixed(2)} ج.م</span>
        </div>
      </div>
    </div>
  </div>
);

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [expandedShift, setExpandedShift] = useState<number | null>(null);

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
                        <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-tighter">صافي الخزينة المتوقع</p>
                        <p className={clsx("text-lg font-black", !isFinished ? "text-amber-400" : "text-emerald-400")}>
                          {shift.netCash.toFixed(2)} ج.م
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Returns & Expenses Summary (Small) */}
                  <div className="px-6 pb-4 flex items-center gap-4">
                     {(() => {
                        const allReturnsCount = shift.saleReturns?.length || 0;
                        const allReturnsTotal = shift.saleReturns?.reduce((acc, r) => acc + r.totalRefund, 0) || 0;
                        if (allReturnsCount === 0) return null;
                        return (
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20">
                             <TrendingDown size={14} className="text-rose-400" />
                             <span className="text-[11px] font-bold text-rose-400">{allReturnsCount} مرتجع ({allReturnsTotal.toFixed(2)})</span>
                           </div>
                        );
                     })()}
                     {shift.expenses && shift.expenses.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <AlertCircle size={14} className="text-amber-400" />
                          <span className="text-[11px] font-bold text-amber-400">{shift.expenses.length} مصروفات</span>
                        </div>
                     )}
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

                  {/* Detailed Analysis (Expanded) */}
                  {isExpanded && (
                    <div className="mt-8 animate-in slide-in-from-top-4 duration-500 border-t border-slate-800 pt-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* 1. Payment Mix Analytics */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                             <DollarSign size={16} className="text-emerald-400" /> توزيع طرق الدفع
                          </h4>
                          <div className="bg-slate-950/40 rounded-2xl p-5 border border-slate-800/50 space-y-4">
                             {(() => {
                               const cash = shift.sales?.filter(s => s.paymentMethod === 'CASH').reduce((acc, s) => acc + s.finalAmount, 0) || 0;
                               const visa = shift.sales?.filter(s => s.paymentMethod === 'VISA').reduce((acc, s) => acc + s.finalAmount, 0) || 0;
                               const wallet = shift.sales?.filter(s => s.paymentMethod === 'WALLET').reduce((acc, s) => acc + s.finalAmount, 0) || 0;
                               const total = cash + visa + wallet || 1;
                               return (
                                 <div className="space-y-4">
                                   <div className="space-y-2">
                                     <div className="flex justify-between text-xs">
                                       <span className="text-slate-500">نقدي (كاش)</span>
                                       <span className="text-emerald-400 font-bold">{cash.toFixed(2)} ج.م</span>
                                     </div>
                                     <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                       <div className="h-full bg-emerald-500" style={{ width: `${(cash/total)*100}%` }} />
                                     </div>
                                   </div>
                                   <div className="space-y-2">
                                     <div className="flex justify-between text-xs">
                                       <span className="text-slate-500">فيزا / بطاقة</span>
                                       <span className="text-blue-400 font-bold">{visa.toFixed(2)} ج.م</span>
                                     </div>
                                     <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                       <div className="h-full bg-blue-500" style={{ width: `${(visa/total)*100}%` }} />
                                     </div>
                                   </div>
                                    <div className="space-y-2">
                                     <div className="flex justify-between text-xs">
                                       <span className="text-slate-500">محفظة إلكترونية</span>
                                       <span className="text-purple-400 font-bold">{wallet.toFixed(2)} ج.م</span>
                                     </div>
                                     <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                       <div className="h-full bg-purple-500" style={{ width: `${(wallet/total)*100}%` }} />
                                     </div>
                                   </div>
                                 </div>
                               );
                             })()}
                          </div>
                        </div>

                        {/* 2. Top Products Information */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                             <TrendingUp size={16} className="text-blue-400" /> المنتجات الأكثر طلباً
                          </h4>
                          <div className="bg-slate-950/40 rounded-2xl p-5 border border-slate-800/50">
                             {(() => {
                               const products: Record<string, number> = {};
                               shift.sales?.forEach(s => s.items.forEach(i => {
                                 const name = i.product.name;
                                 products[name] = (products[name] || 0) + i.quantity;
                               }));
                               const sorted = Object.entries(products).sort((a,b) => b[1] - a[1]).slice(0, 5);
                               
                               if (sorted.length === 0) return <p className="text-xs text-slate-600 italic py-4">لا توجد أصناف في هذه الوردية</p>;
                               
                               return (
                                 <div className="space-y-3">
                                   {sorted.map(([name, qty]) => (
                                     <div key={name} className="flex items-center justify-between group/prod">
                                       <span className="text-xs text-slate-400 truncate max-w-[150px] group-hover/prod:text-white transition-colors">{name}</span>
                                       <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold">{qty} قطعة</span>
                                     </div>
                                   ))}
                                 </div>
                               );
                             })()}
                          </div>
                        </div>

                        {/* 3. Expenses Breakdown */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                             <ArrowDownRight size={16} className="text-rose-400" /> المصروفات بالتفصيل
                          </h4>
                          <div className="bg-slate-950/40 rounded-2xl border border-slate-800/50 overflow-hidden max-h-[220px] overflow-y-auto custom-scrollbar">
                             {shift.expenses && shift.expenses.length > 0 ? (
                               <table className="w-full text-right text-xs">
                                 <thead className="bg-slate-900/50 text-slate-500 font-bold sticky top-0">
                                   <tr>
                                      <th className="px-4 py-2">البيان</th>
                                      <th className="px-4 py-2">القيمة</th>
                                   </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-800/30">
                                   {shift.expenses.map(exp => (
                                      <tr key={exp.id} className="hover:bg-rose-500/5 transition-colors">
                                        <td className="px-4 py-2.5 text-slate-400">{exp.title}</td>
                                        <td className="px-4 py-2.5 text-rose-400 font-bold">{exp.amount.toFixed(2)}</td>
                                      </tr>
                                   ))}
                                 </tbody>
                               </table>
                             ) : (
                                <p className="text-xs text-slate-600 italic p-6 text-center">لا توجد مصروفات مسجلة</p>
                             )}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Ledger */}
                      <div className="mt-10 space-y-4">
                        <h4 className="text-sm font-bold text-slate-400">سجل الفواتير التفصيلي</h4>
                        <div className="bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden">
                          <table className="w-full text-right">
                            <thead className="bg-slate-900/50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                              <tr>
                                <th className="px-6 py-3">الفاتورة</th>
                                <th className="px-6 py-3">الوقت</th>
                                <th className="px-6 py-3">طريقة الدفع</th>
                                <th className="px-6 py-3">الأصناف</th>
                                <th className="px-6 py-3">المبلغ</th>
                                <th className="px-6 py-3 text-left">الإجراء</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-800/50">
                              {shift.sales && shift.sales.length > 0 ? shift.sales.map(sale => (
                                <tr key={sale.id} className="hover:bg-white/5 transition-colors group/row">
                                  <td className="px-6 py-4 font-mono text-blue-400 text-xs">#{sale.id}</td>
                                  <td className="px-6 py-4 text-slate-400 text-[10px]">
                                    {new Date(sale.invoiceDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={clsx(
                                      "px-2 py-1 rounded-md text-[10px] font-bold",
                                      sale.paymentMethod === 'CASH' ? "bg-emerald-500/10 text-emerald-400" : (sale.paymentMethod === 'VISA' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400")
                                    )}>
                                      {sale.paymentMethod === 'CASH' ? 'كاش' : (sale.paymentMethod === 'VISA' ? 'فيزا' : 'محفظة')}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <p className="text-[10px] text-slate-500 truncate max-w-sm">
                                        {sale.items.map(i => `${i.product.name} (x${i.quantity})`).join(', ')}
                                      </p>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-white text-xs whitespace-nowrap">{sale.finalAmount.toFixed(2)} ج.م</td>
                                  <td className="px-6 py-4 text-left">
                                      <button 
                                        onClick={() => setSelectedSale(sale)}
                                        className="p-2 bg-slate-800 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all flex items-center gap-2 group/btn"
                                      >
                                        <Eye size={14} className="group-hover/btn:scale-110 transition-transform" />
                                        <span className="text-[10px] hidden group-hover/row:inline">عرض</span>
                                      </button>
                                  </td>
                                </tr>
                              )) : (
                                  <tr>
                                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">لا توجد مبيعات مسجلة في هذه الوردية</td>
                                  </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <FileText className="text-blue-400" size={20} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">تفاصيل الفاتورة</h3>
                   <p className="text-[10px] text-slate-500 font-mono">#{selectedSale.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSale(null)}
                className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Receipt Style) */}
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="bg-white p-8 rounded-xl shadow-sm text-slate-900 print:shadow-none space-y-6 min-h-[400px]">
                {/* Store Branding (Sample) */}
                <div className="text-center space-y-1">
                   <h2 className="text-xl font-black uppercase tracking-widest text-slate-950">نظام المكتبي</h2>
                   <p className="text-[10px] text-slate-500 font-bold">نموذج معاينة فاتورة إلكترونية</p>
                </div>

                <div className="border-y border-dashed border-slate-300 py-3 flex justify-between text-[11px] font-bold text-slate-600">
                   <span>التاريخ: {new Date(selectedSale.invoiceDate).toLocaleDateString('ar-EG')}</span>
                   <span>الوقت: {new Date(selectedSale.invoiceDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Items Table */}
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="py-2 text-slate-500 font-bold">الصنف</th>
                      <th className="py-2 text-center text-slate-500 font-bold">الكمية</th>
                      <th className="py-2 text-left text-slate-500 font-bold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSale.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-3 font-medium text-slate-800">{item.product.name}</td>
                        <td className="py-3 text-center font-bold text-slate-600">{item.quantity}</td>
                        <td className="py-3 text-left font-bold text-slate-950">{item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                    <span>المجموع الفرعي</span>
                    <span>{selectedSale.totalAmount.toFixed(2)} ج.م</span>
                  </div>
                  {selectedSale.totalAmount > selectedSale.finalAmount && (
                    <div className="flex justify-between text-[11px] text-rose-500 font-bold">
                      <span>الخصم</span>
                      <span>-{(selectedSale.totalAmount - selectedSale.finalAmount).toFixed(2)} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-slate-950 pt-2">
                    <span>الإجمالي</span>
                    <span>{selectedSale.finalAmount.toFixed(2)} ج.م</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-600">
                   <span>طريقة الدفع:</span>
                   <span className="px-2 py-0.5 bg-slate-200 rounded uppercase">
                     {selectedSale.paymentMethod === 'CASH' ? 'نقدي' : (selectedSale.paymentMethod === 'VISA' ? 'فيزا' : 'محفظة')}
                   </span>
                </div>

                <div className="text-center pt-6">
                   <p className="text-[10px] text-slate-400 font-bold">شكراً لثقتكم بنا</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-800 flex gap-4 bg-slate-900/50">
               <button 
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
               >
                 <Printer size={18} /> طباعة الفاتورة
               </button>
               <button 
                onClick={() => setSelectedSale(null)}
                className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
               >
                 إغلاق
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

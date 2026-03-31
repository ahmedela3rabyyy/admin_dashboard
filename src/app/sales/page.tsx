'use client';

import { useState, useEffect, useCallback } from 'react';
import { Receipt, Search, Calendar, Eye, X, FileText, DollarSign, CreditCard, ShoppingBag, TrendingUp, Filter } from 'lucide-react';
import { ExportCSV } from '@/components/ExportCSV';

interface SaleItem {
  id: number; productId: number; quantity: number;
  unitBuyPriceAtSale: number; unitSellPriceAtSale: number;
  discountAmount: number; totalPrice: number;
  product: { name: string; barcode: string | null; unit: string | null } | null;
}

interface Sale {
  id: number; invoiceDate: string; totalAmount: number; discount: number;
  finalAmount: number; paymentMethod: string; notes: string | null;
  items: SaleItem[];
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [search, setSearch] = useState('');

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sales');
      if (res.ok) setSales(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const filtered = sales.filter(s =>
    String(s.id).includes(search) ||
    s.items.some(i => i.product?.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = filtered.reduce((s, sale) => s + sale.finalAmount, 0);
  const totalInvoices = filtered.length;
  const avgInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">سجل المبيعات</h2>
          <p className="text-slate-400">جميع الفواتير المتزامنة من نقاط البيع</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث (رقم فاتورة أو منتج)..."
              className="pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64" />
          </div>
          <ExportCSV
            data={filtered.map(s => ({ id: s.id, date: new Date(s.invoiceDate).toLocaleString('ar-EG'), items: s.items.length, discount: s.discount, payment: s.paymentMethod, total: s.finalAmount }))}
            filename="sales_report"
            headers={[
              { key: 'id', label: 'رقم الفاتورة' },
              { key: 'date', label: 'التاريخ' },
              { key: 'items', label: 'عدد الأصناف' },
              { key: 'discount', label: 'الخصم' },
              { key: 'payment', label: 'طريقة الدفع' },
              { key: 'total', label: 'الإجمالي' },
            ]}
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg"><Receipt className="h-5 w-5 text-blue-400" /></div>
          <div><p className="text-xs text-slate-500">عدد الفواتير</p><p className="text-xl font-bold text-white">{totalInvoices}</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="h-5 w-5 text-emerald-400" /></div>
          <div><p className="text-xs text-slate-500">إجمالي الإيرادات</p><p className="text-xl font-bold text-emerald-400">{totalRevenue.toFixed(2)} ج.م</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg"><TrendingUp className="h-5 w-5 text-amber-400" /></div>
          <div><p className="text-xs text-slate-500">متوسط الفاتورة</p><p className="text-xl font-bold text-amber-400">{avgInvoice.toFixed(2)} ج.م</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-950/50 text-slate-400">
              <tr>
                <th className="px-5 py-4 font-medium">رقم الفاتورة</th>
                <th className="px-5 py-4 font-medium">التاريخ والوقت</th>
                <th className="px-5 py-4 font-medium">الأصناف</th>
                <th className="px-5 py-4 font-medium">الخصم</th>
                <th className="px-5 py-4 font-medium">طريقة الدفع</th>
                <th className="px-5 py-4 font-medium">الإجمالي</th>
                <th className="px-5 py-4 font-medium text-center">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td></tr>
              ) : filtered.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-4"><span className="font-mono text-white bg-slate-800 px-2 py-1 rounded">#{sale.id}</span></td>
                  <td className="px-5 py-4 text-slate-300">
                    <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-500" />{new Date(sale.invoiceDate).toLocaleString('ar-EG')}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {sale.items.length} أصناف
                    <div className="text-xs text-slate-600 mt-0.5 truncate max-w-[180px]">{sale.items.map(i => i.product?.name).filter(Boolean).join('، ')}</div>
                  </td>
                  <td className="px-5 py-4 text-rose-400">{sale.discount > 0 ? `${sale.discount.toFixed(2)} ج.م` : '-'}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${sale.paymentMethod === 'CASH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                      {sale.paymentMethod === 'CASH' ? 'كاش' : sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-emerald-400 text-base">{sale.finalAmount.toFixed(2)} ج.م</td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => setSelectedSale(sale)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all" title="عرض الفاتورة">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">لا توجد فواتير مبيعات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== Invoice Modal ===================== */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSale(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Invoice Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl"><FileText className="h-6 w-6 text-blue-400" /></div>
                <div>
                  <h3 className="text-xl font-bold text-white">فاتورة #{selectedSale.id}</h3>
                  <p className="text-xs text-slate-500">{new Date(selectedSale.invoiceDate).toLocaleString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"><X className="h-5 w-5" /></button>
            </div>

            {/* Invoice Items Table */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden mb-6">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-800/50 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">الصنف</th>
                    <th className="px-4 py-3 font-medium">الكمية</th>
                    <th className="px-4 py-3 font-medium">سعر الواحدة</th>
                    <th className="px-4 py-3 font-medium">الخصم</th>
                    <th className="px-4 py-3 font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {selectedSale.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{item.product?.name || `منتج #${item.productId}`}</p>
                        {item.product?.barcode && <p className="text-[10px] text-slate-600 font-mono">{item.product.barcode}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{item.quantity} {item.product?.unit || 'قطعة'}</td>
                      <td className="px-4 py-3 text-slate-300">{item.unitSellPriceAtSale.toFixed(2)}</td>
                      <td className="px-4 py-3 text-rose-400">{item.discountAmount > 0 ? item.discountAmount.toFixed(2) : '-'}</td>
                      <td className="px-4 py-3 text-white font-bold">{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Summary */}
            <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">المجموع قبل الخصم</span>
                <span className="text-white">{selectedSale.totalAmount.toFixed(2)} ج.م</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-rose-400">الخصم</span>
                  <span className="text-rose-400">- {selectedSale.discount.toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                <span className="text-white font-bold text-lg">الإجمالي النهائي</span>
                <span className="text-emerald-400 font-bold text-2xl">{selectedSale.finalAmount.toFixed(2)} ج.م</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-400">طريقة الدفع: </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedSale.paymentMethod === 'CASH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {selectedSale.paymentMethod === 'CASH' ? 'نقدي (كاش)' : selectedSale.paymentMethod}
                </span>
              </div>
              {selectedSale.notes && (
                <div className="pt-2 text-sm text-slate-500 bg-slate-900 rounded-lg p-3 mt-2">
                  <span className="text-slate-400 font-medium">ملاحظات: </span>{selectedSale.notes}
                </div>
              )}
            </div>

            {/* Profit Analysis for this invoice */}
            <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4" />تحليل الأرباح لهذه الفاتورة</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-slate-500">الإيرادات</p>
                  <p className="text-white font-bold">{selectedSale.finalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">تكلفة البضاعة</p>
                  <p className="text-slate-300 font-bold">{selectedSale.items.reduce((s, i) => s + (i.unitBuyPriceAtSale * i.quantity), 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">صافي الربح</p>
                  <p className="text-emerald-400 font-bold">
                    {(selectedSale.finalAmount - selectedSale.items.reduce((s, i) => s + (i.unitBuyPriceAtSale * i.quantity), 0)).toFixed(2)} ج.م
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

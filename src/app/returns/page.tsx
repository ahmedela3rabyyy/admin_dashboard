'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Search, Calendar, User, Hash, Info, ChevronDown, ChevronUp, ExternalLink, Package } from 'lucide-react';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/returns').then(r => r.json()).then(setReturns).finally(() => setLoading(false));
  }, []);

  const filteredReturns = returns.filter(r => 
    r.id.toString().includes(search) || 
    r.saleId.toString().includes(search)
  );

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <RotateCcw className="h-8 w-8 text-rose-500" />
            إدارة المرتجعات
          </h2>
          <p className="text-slate-400 mt-1">عرض وتتبع كافة الفواتير المرتجعة وتفاصيلها</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="بحث برقم المرتجع أو الفاتورة..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-sm font-semibold text-slate-300">رقم المرتجع</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-300">الفاتورة الأصلية</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-300">التاريخ</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-300">المبلغ المسترد</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-300">البائع</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-300">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">لا توجد مرتجعات متطابقة</td>
                </tr>
              )}
              {filteredReturns.map((r) => (
                <React.Fragment key={r.id}>
                  <tr className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">#{r.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-sm font-medium text-white">{r.saleId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(r.returnDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-rose-400">{r.totalRefund.toFixed(2)} ج.م</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        {r.shift?.user?.fullName || 'غير معروف'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {expandedId === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        التفاصيل
                      </button>
                    </td>
                  </tr>
                  
                  {expandedId === r.id && (
                    <tr className="bg-slate-950/30">
                      <td colSpan={6} className="px-6 py-6 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                              <Package className="h-4 w-4 text-blue-500" />
                              الأصناف المرتجعة
                            </h4>
                            <div className="space-y-2">
                              {r.items.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">{item.product?.name || `منتج #${item.productId}`}</span>
                                    <span className="text-[10px] text-slate-500">سعر البيع: {item.unitSellPriceAtSale.toFixed(2)} ج.م</span>
                                  </div>
                                  <div className="text-left">
                                    <span className="text-xs font-bold text-emerald-400">× {item.quantity}</span>
                                    <p className="text-xs font-bold text-white mt-1">{item.refundAmount.toFixed(2)} ج.م</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                              <Info className="h-4 w-4 text-blue-500" />
                              معلومات إضافية
                            </h4>
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">إجمالي الفاتورة الأصلية:</span>
                                <span className="text-white font-mono">{r.sale?.finalAmount?.toFixed(2) || '0.00'} ج.م</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">رقم الجهاز:</span>
                                <span className="text-white font-mono">{r.deviceId}</span>
                              </div>
                              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                                <span className="text-slate-500 italic text-[10px]">مزامنة سحابية</span>
                                <span className="text-emerald-500 flex items-center gap-1 font-bold">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                  مؤكد
                                </span>
                              </div>
                            </div>
                            
                            <a 
                              href={`/sales?id=${r.saleId}`}
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white transition-all border border-slate-700"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                              عرض الفاتورة الأصلية
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

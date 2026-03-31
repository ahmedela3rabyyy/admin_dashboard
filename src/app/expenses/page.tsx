'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Activity, DollarSign, TrendingDown } from 'lucide-react';
import { ExportCSV } from '@/components/ExportCSV';

interface Expense {
  id: number; title: string; amount: number; expenseType: string;
  beneficiary: string | null; expenseDate: string; notes: string | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses');
      if (res.ok) setExpenses(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const filtered = expenses.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.beneficiary?.toLowerCase().includes(search.toLowerCase())) ||
    e.expenseType.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">سجل المصروفات</h2>
          <p className="text-slate-400">جميع المصروفات المتزامنة من نقاط البيع</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في المصروفات..."
              className="pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64" />
          </div>
          <ExportCSV
            data={filtered.map(e => ({ id: e.id, date: new Date(e.expenseDate).toLocaleString('ar-EG'), title: e.title, type: e.expenseType, beneficiary: e.beneficiary || '-', amount: e.amount }))}
            filename="expenses_report"
            headers={[
              { key: 'id', label: 'رقم الحركة' },
              { key: 'date', label: 'التاريخ' },
              { key: 'title', label: 'البيان' },
              { key: 'type', label: 'التصنيف' },
              { key: 'beneficiary', label: 'المستفيد' },
              { key: 'amount', label: 'القيمة' },
            ]}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg"><TrendingDown className="h-5 w-5 text-rose-400" /></div>
          <div><p className="text-xs text-slate-500">إجمالي المصروفات</p><p className="text-xl font-bold text-rose-400">{totalAmount.toFixed(2)} ج.م</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg"><Activity className="h-5 w-5 text-blue-400" /></div>
          <div><p className="text-xs text-slate-500">عدد الحركات</p><p className="text-xl font-bold text-white">{filtered.length}</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-950/50 text-slate-400">
              <tr>
                <th className="px-5 py-4 font-medium">رقم الحركة</th>
                <th className="px-5 py-4 font-medium">التاريخ والوقت</th>
                <th className="px-5 py-4 font-medium">البيان (العنوان)</th>
                <th className="px-5 py-4 font-medium">التصنيف</th>
                <th className="px-5 py-4 font-medium">المستفيد</th>
                <th className="px-5 py-4 font-medium">القيمة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td></tr>
              ) : filtered.map(expense => (
                <tr key={expense.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-4"><span className="font-mono text-white bg-slate-800 px-2 py-1 rounded">#{expense.id}</span></td>
                  <td className="px-5 py-4 text-slate-300">
                    <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-500" />{new Date(expense.expenseDate).toLocaleString('ar-EG')}</div>
                  </td>
                  <td className="px-5 py-4 text-white font-medium">
                    {expense.title}
                    {expense.notes && <div className="text-xs text-slate-500 mt-0.5">{expense.notes}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">{expense.expenseType}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{expense.beneficiary || '-'}</td>
                  <td className="px-5 py-4 font-bold text-rose-400 text-base">{expense.amount.toFixed(2)} ج.م</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">لا توجد مصروفات مسجلة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { Key, Mail, Calendar, Package, Receipt, Activity, Shield, Copy, Store } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const headersList = await headers();
  const storeId = headersList.get('x-store-id');
  if (!storeId) return null;

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  const stats = {
    products: await prisma.product.count({ where: { storeId } }),
    sales: await prisma.sale.count({ where: { storeId } }),
    expenses: await prisma.expense.count({ where: { storeId } }),
    employees: await prisma.employee.count({ where: { storeId } }),
    suppliers: await prisma.storeSupplier.count({ where: { storeId } }),
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-3xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">إعدادات المتجر</h2>
        <p className="text-slate-400 mt-1">إدارة حسابك ومعلومات الربط</p>
      </div>

      {/* Store Info Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Store className="h-5 w-5 text-blue-400" />
          معلومات المتجر
        </h3>
        <div className="grid gap-4">
          <div className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-xl">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Store className="h-5 w-5 text-blue-400" /></div>
            <div>
              <p className="text-xs text-slate-500">اسم المتجر</p>
              <p className="text-white font-medium">{store?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-xl">
            <div className="p-2 bg-purple-500/10 rounded-lg"><Mail className="h-5 w-5 text-purple-400" /></div>
            <div>
              <p className="text-xs text-slate-500">البريد الإلكتروني</p>
              <p className="text-white font-medium">{store?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-xl">
            <div className="p-2 bg-emerald-500/10 rounded-lg"><Calendar className="h-5 w-5 text-emerald-400" /></div>
            <div>
              <p className="text-xs text-slate-500">تاريخ التسجيل</p>
              <p className="text-white font-medium">{store?.createdAt ? new Date(store.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Card */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 to-slate-900 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-400" />
          مفتاح الربط (Store API Key)
        </h3>
        <p className="text-slate-400 text-sm">انسخ هذا المفتاح والصقه في نافذة &quot;إعدادات الربط السحابي&quot; داخل برنامج المكتبة على الويندوز.</p>
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-4">
          <Shield className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <code className="text-blue-400 font-mono text-sm select-all flex-1 break-all">{storeId}</code>
        </div>
      </div>

      {/* Stats Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">إحصائيات البيانات المتزامنة</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-slate-950/50 rounded-xl">
            <Package className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.products}</p>
            <p className="text-xs text-slate-500">منتج</p>
          </div>
          <div className="text-center p-4 bg-slate-950/50 rounded-xl">
            <Receipt className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.sales}</p>
            <p className="text-xs text-slate-500">فاتورة</p>
          </div>
          <div className="text-center p-4 bg-slate-950/50 rounded-xl">
            <Activity className="h-6 w-6 text-rose-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.expenses}</p>
            <p className="text-xs text-slate-500">مصروف</p>
          </div>
          <div className="text-center p-4 bg-slate-950/50 rounded-xl">
            <Activity className="h-6 w-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.employees}</p>
            <p className="text-xs text-slate-500">موظف</p>
          </div>
          <div className="text-center p-4 bg-slate-950/50 rounded-xl">
            <Activity className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.suppliers}</p>
            <p className="text-xs text-slate-500">مورد</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-rose-500/20 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-rose-400 mb-2">منطقة الخطر</h3>
        <p className="text-slate-400 text-sm mb-4">تسجيل الخروج يمسح جلستك فقط ولا يحذف بياناتك.</p>
        <a href="/api/auth/logout" className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all font-medium text-sm">
          تسجيل الخروج
        </a>
      </div>
    </div>
  );
}

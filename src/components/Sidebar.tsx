"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Receipt, LogOut, Settings, BarChart3, Bell, Menu, X, Users2 } from "lucide-react";
import { clsx } from "clsx";
import { useState, useEffect } from "react";

const navItems = [
  { name: "الرئيسية", href: "/", icon: LayoutDashboard },
  { name: "يوميات الموظفين", href: "/shifts", icon: Users2 },
  { name: "التقارير", href: "/reports", icon: BarChart3 },
  { name: "المبيعات", href: "/sales", icon: ShoppingCart },
  { name: "المنتجات", href: "/products", icon: Package },
  { name: "المصروفات", href: "/expenses", icon: Receipt },
  { name: "الإشعارات", href: "/notifications", icon: Bell },
  { name: "الإعدادات", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [storeName, setStoreName] = useState('');

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (d.store?.name) setStoreName(d.store.name);
    }).catch(() => {});
  }, []);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-4 right-4 z-50 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-lg"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "flex h-screen w-64 flex-col bg-slate-950 text-white border-l border-slate-800 flex-shrink-0 z-40",
        "fixed md:relative transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-slate-800">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold tracking-wider truncate max-w-[200px]">
              <span className="text-blue-500">{storeName || 'Mizan'}</span> <span className="text-white">Admin</span>
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 text-sm",
                  isActive
                    ? "bg-blue-600 shadow-lg shadow-blue-600/20 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.name}</span>
                {item.name === "الإشعارات" && (
                  <span className="mr-auto w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <a href="/api/auth/logout" className="flex items-center gap-3 px-4 py-2 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-sm">
            <LogOut size={16} /><span className="font-medium">تسجيل الخروج</span>
          </a>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/30">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold shadow-lg shadow-blue-500/20">M</div>
            <div>
              <p className="text-xs font-medium text-white leading-tight">لوحة الإدارة</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] text-emerald-400">متصل</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertOctagon, Info, CheckCircle, Package, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';

interface Notification {
  id: string; type: string; severity: 'info' | 'warning' | 'danger' | 'success';
  title: string; message: string;
}

const severityConfig = {
  danger:  { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertOctagon, iconColor: 'text-red-400' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, iconColor: 'text-amber-400' },
  info:    { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info, iconColor: 'text-blue-400' },
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle, iconColor: 'text-emerald-400' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchData = () => {
    setLoading(true);
    fetch('/api/notifications').then(r => r.json()).then(d => setNotifications(d.notifications || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.severity === filter);
  const dangerCount = notifications.filter(n => n.severity === 'danger').length;
  const warningCount = notifications.filter(n => n.severity === 'warning').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">الإشعارات الذكية</h2>
          <p className="text-slate-400">تنبيهات تلقائية وتحليلات لمساعدتك في إدارة المكتبة</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button onClick={() => setFilter('all')} className={`p-4 rounded-xl border transition-all text-center ${filter === 'all' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
          <Bell className="h-5 w-5 text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{notifications.length}</p>
          <p className="text-xs text-slate-400">الكل</p>
        </button>
        <button onClick={() => setFilter('danger')} className={`p-4 rounded-xl border transition-all text-center ${filter === 'danger' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
          <AlertOctagon className="h-5 w-5 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{dangerCount}</p>
          <p className="text-xs text-slate-400">خطر</p>
        </button>
        <button onClick={() => setFilter('warning')} className={`p-4 rounded-xl border transition-all text-center ${filter === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
          <AlertTriangle className="h-5 w-5 text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{warningCount}</p>
          <p className="text-xs text-slate-400">تحذير</p>
        </button>
        <button onClick={() => setFilter('success')} className={`p-4 rounded-xl border transition-all text-center ${filter === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
          <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{notifications.filter(n => n.severity === 'success').length}</p>
          <p className="text-xs text-slate-400">إنجازات</p>
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => {
            const config = severityConfig[n.severity];
            const Icon = config.icon;
            return (
              <div key={n.id} className={`${config.bg} border ${config.border} rounded-xl p-4 flex items-start gap-4`}>
                <div className={`p-2 rounded-lg ${config.bg}`}><Icon className={`h-5 w-5 ${config.iconColor}`} /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm mb-0.5">{n.title}</h4>
                  <p className="text-slate-400 text-sm">{n.message}</p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 bg-slate-900 rounded-2xl border border-dashed border-slate-800">
              <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">كل شيء تمام! ✅</h3>
              <p className="text-slate-500">لا توجد إشعارات من هذا النوع حالياً.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

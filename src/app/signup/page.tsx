'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Store } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'حدث خطأ في التسجيل');
    } else {
      setSuccess('تم تسجيل متجرك بنجاح! جاري تحويلك...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 px-4">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="mb-8 text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-2xl mb-4">
            <Store size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">استضف مكتبتك</h1>
          <p className="text-slate-400">سجل مكتبتك لتبدأ المزامنة السحابية للوحة التحكم</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 text-sm p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-sm p-4 rounded-xl mb-6 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2" dir="rtl">اسم المكتبة / المتجر</label>
            <input 
              dir="rtl"
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              placeholder="مثال: مكتبة الميزان"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2" dir="rtl">البريد الإلكتروني</label>
            <input 
              dir="rtl"
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              placeholder="admin@store.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2" dir="rtl">كلمة المرور</label>
            <input 
              dir="rtl"
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            إنشاء حساب
            <ArrowRight size={18} className="transform group-hover:-translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm">
          لديك حساب بالفعل؟
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium mr-2">سجل الدخول</Link>
        </p>
      </div>
    </div>
  );
}

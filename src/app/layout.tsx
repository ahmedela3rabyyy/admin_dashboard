import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Mizan Admin Dashboard',
  description: 'Manage your stationery system remotely',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  const isLoggedIn = !!token;

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-slate-950 text-slate-50 min-h-screen flex flex-col">
        {isLoggedIn ? (
          <div className="flex flex-1 h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        ) : (
          <main className="flex-1 w-full">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}

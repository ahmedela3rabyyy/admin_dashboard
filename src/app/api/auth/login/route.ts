import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/hash';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'من فضلك أدخل البريد وكلمة المرور' }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { email } });
    if (!store || !verifyPassword(password, store.password)) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    const token = await signToken({ storeId: store.id, email: store.email, name: store.name });
    
    // Set HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return NextResponse.json({ success: true, store });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

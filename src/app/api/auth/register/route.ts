import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/hash';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'من فضلك أرسل الاسم والبريد وكلمة المرور' }, { status: 400 });
    }

    const existingUser = await prisma.store.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    }

    const store = await prisma.store.create({
      data: {
        name,
        email,
        password: hashPassword(password),
      }
    });

    return NextResponse.json({ success: true, message: 'تم إنشاء החساب بنجاح', storeId: store.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

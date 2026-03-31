import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  const url = new URL('/login', req.url);
  return NextResponse.redirect(url);
}

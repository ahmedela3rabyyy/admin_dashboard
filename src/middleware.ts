import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  // Desktop Python APIs will use API tokens directly in the POST body or Headers (not cookies)
  const isSyncApi = pathname.startsWith('/api/sync');

  if (!token && !isAuthPage && !isSyncApi) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && !isSyncApi) {
    const payload = await verifyToken(token);
    if (!payload && !isAuthPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (payload && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Inject tenant id for downstream route handlers
    if (payload) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-store-id', payload.storeId);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get("next-auth.session-token")?.value || 
                req.cookies.get("__Secure-next-auth.session-token")?.value;

  const protectedRoutes = ['/dashboard', '/user', '/product'];
  const isProtected = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/user/:path*', '/product/:path*', '/login'],
};

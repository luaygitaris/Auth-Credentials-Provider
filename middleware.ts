import { auth } from '@/auth'; // sesuaikan dengan path file auth Anda
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const session = await auth(); // gunakan auth helper

  const protectedRoutes = ['/dashboard', '/user', '/product'];
  const isProtected = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  if (!session?.user && isProtected) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session?.user && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/user/:path*', '/product/:path*', '/login'],
};

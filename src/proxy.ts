import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('x-pathname', request.nextUrl.pathname);

  const isAuthenticated =
    request.cookies.get('is-authenticated')?.value === 'true';

  // Prevents logged-in users accessing /login direct URL
  if (isAuthenticated && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/explore', request.url));
  }
  if (isAuthenticated) return response;
}
export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

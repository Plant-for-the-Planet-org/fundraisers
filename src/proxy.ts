import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { isProductionHost } from '@/lib/utils/site-url';

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!isProductionHost(host)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}
export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { isProductionHost } from '@/lib/utils/site-url';
import { routeLocale, URL_LOCALE_HEADER } from '@/i18n/locale-routing';

export function proxy(request: NextRequest) {
  const route = routeLocale({
    pathname: request.nextUrl.pathname,
    cookieLocale: request.cookies.get('ui-locale')?.value,
  });

  let response: NextResponse;
  if (route.type === 'redirect') {
    const url = request.nextUrl.clone();
    url.pathname = route.pathname;
    response = NextResponse.redirect(url, 307);
    // The redirect depends on the cookie, so no shared cache may reuse it.
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Vary', 'Cookie');
  } else {
    const pathname =
      route.type === 'rewrite' ? route.pathname : request.nextUrl.pathname;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);
    // Drop any value sent by the client, so only the proxy decides it.
    requestHeaders.delete(URL_LOCALE_HEADER);
    if (route.locale) requestHeaders.set(URL_LOCALE_HEADER, route.locale);

    if (route.type === 'rewrite') {
      const url = request.nextUrl.clone();
      url.pathname = pathname;
      response = NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });
    } else {
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

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

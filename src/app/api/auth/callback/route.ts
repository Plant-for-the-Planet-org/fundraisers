import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

// Whitelist of allowed redirect destinations
const ALLOWED_REDIRECTS = ['/dash', '/explore'];

function getSafeRedirectUrl(state: string | null): string {
  if (!state) return '/dash';

  // Only allow relative paths from whitelist
  const isAllowed = ALLOWED_REDIRECTS.some(path => state.startsWith(path));
  return isAllowed ? state : '/dash';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    const errorDesc = searchParams.get('error_description') ?? error;
    console.error('Auth0 callback error:', errorDesc);
    return NextResponse.redirect(
      new URL(
        `/?error=auth_failed&reason=${encodeURIComponent(errorDesc)}`,
        request.url
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  //Safe redirect — no open redirect vulnerability
  const redirectUrl = getSafeRedirectUrl(state);
  const url = new URL(redirectUrl, request.url);
  url.searchParams.set('code', code);

  const response = NextResponse.redirect(url);

  return response;
}

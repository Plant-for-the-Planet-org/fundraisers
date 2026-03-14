import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

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

  const url = new URL('/redirecting', request.url);
  url.searchParams.set('code', code);
  if (state) url.searchParams.set('state', state);

  const response = NextResponse.redirect(url);

  return response;
}

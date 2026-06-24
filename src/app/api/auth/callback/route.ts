import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { EMAIL_VERIFICATION_PENDING_COOKIE } from '@/lib/constants/auth';

// Maps an auth error_description to a dedicated page. All other errors fall through to the generic auth_failed path.
// We read error_description as sent by the auth provider; the only actionable denial it sends is 'email_not_verified'. (A legacy '401' code seen in other clients does not reach this app and is intentionally not handled.)
const USER_ACTIONABLE_ERRORS: Record<string, string> = {
  email_not_verified: '/verify-email',
};

function getPublicBaseUrl(request: NextRequest): URL {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost ?? request.headers.get('host');
  if (!host) return new URL(request.url);

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const protocol =
    forwardedProto ?? (host.includes('localhost') ? 'http' : 'https');
  return new URL(`${protocol}://${host}`);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const base = getPublicBaseUrl(request);

  if (error) {
    const errorDesc = searchParams.get('error_description') ?? error;
    console.error('Auth0 callback error:', errorDesc);

    const destination = USER_ACTIONABLE_ERRORS[errorDesc];
    if (destination) {
      const response = NextResponse.redirect(new URL(destination, base));
      if (destination === '/verify-email') {
        // Gate the page to users who actually hit this denial.
        response.cookies.set(EMAIL_VERIFICATION_PENDING_COOKIE, '1', {
          maxAge: 600,
          path: '/verify-email',
          httpOnly: true,
          sameSite: 'lax',
          secure: base.protocol === 'https:',
        });
      }
      return response;
    }

    const errUrl = new URL('/', base);
    errUrl.searchParams.set('error', 'auth_failed');
    errUrl.searchParams.set('reason', errorDesc);
    return NextResponse.redirect(errUrl);
  }

  if (!code) {
    const noCodeUrl = new URL('/', base);
    noCodeUrl.searchParams.set('error', 'no_code');
    return NextResponse.redirect(noCodeUrl);
  }

  const url = new URL('/redirecting', base);
  url.searchParams.set('code', code);
  if (state) url.searchParams.set('state', state);

  // A successful login means the email is verified — clear any pending-verify
  // cookie so the user can't land back on /verify-email afterwards.
  const response = NextResponse.redirect(url);
  response.cookies.delete({
    name: EMAIL_VERIFICATION_PENDING_COOKIE,
    path: '/verify-email',
  });
  return response;
}

/**
 * Gets the login page URL with redirect parameter
 * Prevents redirect loops by detecting if already on login page
 */
export function getSignInPageUrl(redirectTo?: string): string {
  if (typeof window === 'undefined') {
    return `/login?redirectTo=${encodeURIComponent(redirectTo || '/dash')}`;
  }

  const { pathname, search } = window.location;
  const isOnLoginPage = pathname === '/login';

  const target = isOnLoginPage
    ? new URLSearchParams(search).get('redirectTo') || redirectTo || '/dash'
    : redirectTo || pathname + search;

  return `/login?redirectTo=${encodeURIComponent(target)}`;
}

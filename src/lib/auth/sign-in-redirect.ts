/**
 * Builds the `/login?redirectTo=...` URL for the given current path.
 *
 * If `currentPath` is already `/login?redirectTo=X`, the inner `X` is reused
 * (falling back to `/explore`) so re-entry doesn't produce nested redirects.
 * Otherwise `currentPath` is used verbatim as the redirect target.
 *
 * Callers are responsible for supplying `currentPath` — this function does not
 * read `window.location`, so it is safe in any environment.
 */
export function getSignInPath(currentPath: string): string {
  const [pathname, search = ''] = currentPath.split('?');
  const isOnLoginPage = pathname === '/login';

  const target = isOnLoginPage
    ? new URLSearchParams(search).get('redirectTo') || '/explore'
    : currentPath;

  return `/login?redirectTo=${encodeURIComponent(target)}`;
}

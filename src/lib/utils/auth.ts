import type { RedirectPath } from '../types/auth';

import { DEFAULT_REDIRECT_PATH, PROTECTED_PATH } from '../constants/auth';
import { ALLOWED_REDIRECT_ROOTS } from '../types/auth';

type JwtPayload = {
  exp?: number;
};

// Check if the given path belongs to a protected route
export function isProtectedRoute(path: string) {
  return PROTECTED_PATH.some(route => path.startsWith(route));
}

// Type guard: path is a same-origin path under an allowed root.
// Rejects protocol-relative (`//...`, `/\...`) and foreign roots like `/exploremore`.
export function isAllowedRedirect(path: string): path is RedirectPath {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.startsWith('/\\')
  ) {
    return false;
  }

  // Strip query/hash before matching the route root
  const pathname = path.split(/[?#]/, 1)[0];

  return ALLOWED_REDIRECT_ROOTS.some(
    root => pathname === root || pathname.startsWith(`${root}/`)
  );
}

// Return a safe redirect path; fallback to default if invalid
export function getSafeRedirectPath(path: string | null): RedirectPath {
  if (path && isAllowedRedirect(path)) {
    return path;
  }
  return DEFAULT_REDIRECT_PATH;
}

// Check if a JWT token is expired (with optional buffer time)
export function isTokenExpired(token: string, bufferSeconds = 30): boolean {
  try {
    const [, base64Url] = token.split('.');
    if (!base64Url) return true;

    // JWT payload is Base64URL encoded, but atob() expects Base64.
    // Convert URL-safe chars and restore '=' padding before decoding.
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const payload: JwtPayload = JSON.parse(atob(padded));

    if (!payload.exp) return false;

    const now = Math.floor(Date.now() / 1000);

    return now >= payload.exp - bufferSeconds;
  } catch {
    return true;
  }
}

const isBrowser = () => typeof window !== 'undefined';

// Get token from localStorage and return it only if still valid
export const getValidStoredToken = () => {
  if (!isBrowser()) return null;

  const token = localStorage.getItem('access_token');

  if (!token) return null;

  if (isTokenExpired(token)) {
    localStorage.removeItem('access_token');
    return null;
  }

  return token;
};

// Removes specified query parameters from the current URL
// and updates the browser history without triggering a page reload.

export function cleanUrl(params: string[]) {
  if (!isBrowser()) return;

  const url = new URL(window.location.href);
  params.forEach(p => url.searchParams.delete(p));
  window.history.replaceState({}, '', url.pathname + url.search);
}

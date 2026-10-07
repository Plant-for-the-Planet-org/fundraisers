/**
 * The site's public origin, as the visitor sees it.
 * Behind a proxy (Coolify, Vercel) the request URL is the internal one, so the forwarded host and protocol win.
 */
export function getPublicBaseUrl(
  requestHeaders: Headers,
  fallback?: string
): URL {
  const host =
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  if (!host) return new URL(fallback ?? 'http://localhost:3000');
  const protocol =
    requestHeaders.get('x-forwarded-proto') ??
    (host.includes('localhost') ? 'http' : 'https');
  return new URL(`${protocol}://${host}`);
}

/**
 * The origin to print on share images and redirect to.
 * In production it is the configured app host, whatever the request says, so a spoofed Host header can neither change the image nor create extra copies of it. Elsewhere (local, previews) it follows the request.
 */
export function getShareOrigin(
  requestHeaders: Headers,
  fallback?: string
): string {
  const appHost = process.env.NEXT_PUBLIC_APP_HOST?.trim();
  return appHost
    ? `https://${appHost}`
    : getPublicBaseUrl(requestHeaders, fallback).origin;
}

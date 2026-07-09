const PRODUCTION_HOSTS = [
  'www.startplanting.org',
  // TODO: remove once this PR's preview deployment is no longer needed
  '292-6jwpb.startplanting.org',
];

const PRODUCTION_FALLBACK_URL = 'https://www.startplanting.org';

// The canonical content domain, used for URLs that must stay pinned to
// production regardless of which host actually served the request (e.g.
// sitemap <loc> entries) - not to be confused with a same-origin file
// reference like robots.ts's own `sitemap:` field, which should follow
// the request host instead.
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  // NEXT_PUBLIC_SITE_URL is baked in at build time from the checked-in
  // .env (localhost default). If a deployment doesn't override it, the
  // var is still truthy, so `?? fallback` alone won't catch it - reject
  // any localhost value explicitly instead of only checking for unset.
  if (configured && !configured.includes('localhost')) {
    return configured.replace(/\/+$/, '');
  }
  return PRODUCTION_FALLBACK_URL;
}

export function isProductionHost(host: string | null | undefined): boolean {
  return !!host && PRODUCTION_HOSTS.includes(host);
}

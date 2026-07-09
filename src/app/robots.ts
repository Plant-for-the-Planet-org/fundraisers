import type { MetadataRoute } from 'next';

import { headers } from 'next/headers';
import { isProductionHost } from '@/lib/utils/site-url';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');

  if (!isProductionHost(host)) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  // Same-origin reference: point to the sitemap on whichever production
  // host actually served this robots.txt, rather than a hardcoded domain
  // (getSiteUrl() is for the sitemap's own <loc> entries, which must stay
  // pinned to the canonical content domain - a different concern).
  const origin = `https://${host}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // '/$' anchors to the exact root path (Googlebot-supported), since
      // '/' is a dead redirect (see next.config.ts) rather than real content.
      // Crawlers that ignore '$' simply won't match this rule.
      disallow: ['/$', '/sentry-test'],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}

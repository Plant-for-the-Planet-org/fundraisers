import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/lib/utils/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // '/$' anchors to the exact root path (Googlebot-supported), since
      // '/' is a dead redirect (see next.config.ts) rather than real content.
      // Crawlers that ignore '$' simply won't match this rule.
      disallow: ['/$', '/sentry-test'],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}

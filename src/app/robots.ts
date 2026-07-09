import type { MetadataRoute } from 'next';

import { headers } from 'next/headers';
import { isProductionHost } from '@/lib/utils/site-url';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');

  if (!isProductionHost(host)) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // '/$' anchors to the exact root path (Googlebot-supported), since
      // '/' is a dead redirect (see next.config.ts) rather than real content.
      // Crawlers that ignore '$' simply won't match this rule.
      disallow: ['/$', '/sentry-test'],
    },
  };
}

import { headers } from 'next/headers';
import Script from 'next/script';
import { resolveUmamiConfig } from '@/lib/analytics/umami';
import { isProductionHost } from '@/lib/utils/site-url';

/**
 * Loads our self-hosted Umami tracker and its recorder, which we run for heatmaps.
 *
 * No consent gate on purpose: neither script writes to the device nor reads a
 * cookie, so ePrivacy / TDDDG never asks for one. See docs/cookie-consent-stance.md.
 *
 * The recorder is the same script Umami uses for session replay, but replay is off
 * at the instance and the server rejects replay payloads when it is. Heatmap payloads
 * carry click coordinates and scroll depth only, never DOM or text.
 *
 * Decided once per document load. A client-side navigation into an untracked path
 * still reports, which is the same trade-off <CookieConsentProvider> already makes.
 */
export async function UmamiAnalytics() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');

  const config = resolveUmamiConfig({
    baseUrl: process.env.NEXT_PUBLIC_UMAMI_URL,
    websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    productionHost: process.env.NEXT_PUBLIC_APP_HOST,
    isProduction: isProductionHost(host),
    pathname: headersList.get('x-pathname') ?? '/',
  });

  if (!config) return null;

  return (
    <>
      <Script
        src={config.src}
        strategy='afterInteractive'
        data-website-id={config.websiteId}
        data-domains={config.domains}
      />
      <Script
        src={config.recorderSrc}
        strategy='afterInteractive'
        data-website-id={config.websiteId}
      />
    </>
  );
}

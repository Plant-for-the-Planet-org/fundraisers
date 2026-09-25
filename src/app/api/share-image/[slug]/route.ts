import type { NextRequest } from 'next/server';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { NextResponse } from 'next/server';
import { hasLocale } from 'next-intl';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getLeaderboard } from '@/lib/api/leaderboard-service';
import { SHARE_PREVIEW_WINDOW_MS } from '@/lib/share/preview';
import { renderFundraiserShareImage } from '@/lib/share/server/render-share-image';
import { resolveFundraiserImageSource } from '@/lib/utils/images';
import { getShareOrigin } from '@/lib/utils/public-base-url';
import { routing } from '@/i18n/routing';

export const runtime = 'nodejs';

const FALLBACK_IMAGE = '/FUNDRAISER-Meta-Cover.jpg';
const MAX_CACHED = 200;

// Crawlers ask for the same preview many times; one render per fundraiser and window is enough.
const cache = new Map<string, { png: Buffer; expires: number }>();

function remember(key: string, png: Buffer) {
  if (cache.size >= MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { png, expires: Date.now() + SHARE_PREVIEW_WINDOW_MS });
}

function pngResponse(png: Buffer) {
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // Public data only, the same the fundraiser page shows, so shared caches may keep it for the window.
      'Cache-Control':
        'public, max-age=600, s-maxage=7200, stale-while-revalidate=86400',
    },
  });
}

/**
 * The link preview image for a fundraiser: its banner with live progress, in its theme.
 * Anything that fails falls back to the cover photo, or the default image, so a link never previews blank.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/share-image/[slug]'>
) {
  const { slug } = await params;
  const requested = request.nextUrl.searchParams.get('l');
  const locale =
    requested && hasLocale(routing.locales, requested)
      ? requested
      : routing.defaultLocale;
  // The printed link and the fallback use the public origin, not the proxy's internal one.
  const origin = getShareOrigin(request.headers, request.url);
  const key = `${origin}:${slug}:${locale}`;

  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return pngResponse(cached.png);

  let fallback = FALLBACK_IMAGE;
  try {
    const fundraiser = await getCachedFundraiser(slug, locale);
    fallback =
      resolveFundraiserImageSource(fundraiser.image, 'large') ?? FALLBACK_IMAGE;
    const leaderboard: LeaderboardApiResponse | null = await getLeaderboard(
      fundraiser.slug,
      10
    ).catch(() => null);
    const png = await renderFundraiserShareImage(fundraiser, {
      locale,
      origin,
      leaderboard,
    });
    remember(key, png);
    return pngResponse(png);
  } catch (error) {
    console.error('[share-image] Falling back for', slug, error);
    return NextResponse.redirect(new URL(fallback, origin), 302);
  }
}

import type { NextRequest } from 'next/server';
import type { RenderedShareImage } from '@/lib/share/server/render-share-image';

import { NextResponse } from 'next/server';
import { hasLocale } from 'next-intl';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { shareImagePath } from '@/lib/share/preview';
import { isServerImageUrl } from '@/lib/share/server/fetch-image';
import { shareImageVersion } from '@/lib/share/server/preview-version';
import { renderFundraiserShareImage } from '@/lib/share/server/render-share-image';
import { loadShareLeaderboard } from '@/lib/share/server/share-leaderboard';
import { resolveFundraiserImageSource } from '@/lib/utils/images';
import { getShareOrigin } from '@/lib/utils/public-base-url';
import { routing } from '@/i18n/routing';

export const runtime = 'nodejs';

const FALLBACK_IMAGE = '/FUNDRAISER-Meta-Cover.jpg';
const MAX_CACHED = 200;

// A complete render is the same every time for its version, so a browser may keep it for a year.
// The CDN keeps it for a day only. While the CDN holds a URL the route does not run, so an old version cannot redirect, and a donor who turns anonymous stays on it for up to a day.
const IMMUTABLE = 'public, max-age=31536000, s-maxage=86400, immutable';
// A render that missed a font or an image that may load next time. Kept for a minute, so a burst of crawlers does not render it again and again.
const PARTIAL_CACHE = 'public, max-age=60, s-maxage=60';
const PARTIAL_MS = 60_000;
// Which version is current changes with every donation, so the pointer to it is kept only briefly.
const REDIRECT_CACHE = 'public, max-age=300, s-maxage=300';

// Crawlers ask for the same preview many times; one complete render per version is enough.
const cache = new Map<string, RenderedShareImage & { expires: number }>();

function remember(key: string, image: RenderedShareImage) {
  cache.delete(key);
  if (cache.size >= MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, {
    ...image,
    expires: image.complete ? Infinity : Date.now() + PARTIAL_MS,
  });
}

function imageResponse({ bytes, complete }: RenderedShareImage) {
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': complete ? IMMUTABLE : PARTIAL_CACHE,
    },
  });
}

function redirectTo(url: URL, cacheControl: string) {
  const response = NextResponse.redirect(url, 302);
  response.headers.set('Cache-Control', cacheControl);
  return response;
}

/**
 * The link preview image for a fundraiser: its banner with live progress, in its theme.
 * Only the current version's URL renders; any other `v` (old, missing or made up) redirects there, so a random `v` cannot force a render.
 * If the fundraiser, its donor row or the render fails, it falls back to the cover photo (on a host the server trusts), or the default image, so a link never previews blank.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/share-image/[slug]'>
) {
  const { slug } = await params;
  const query = request.nextUrl.searchParams;
  const requested = query.get('l');
  const locale =
    requested && hasLocale(routing.locales, requested)
      ? requested
      : routing.defaultLocale;
  // The printed link, the redirects and the fallback use the public origin, not the proxy's internal one.
  const origin = getShareOrigin(request.headers, request.url);

  let fallback = FALLBACK_IMAGE;
  try {
    const fundraiser = await getCachedFundraiser(slug, locale);
    const cover = resolveFundraiserImageSource(fundraiser.image, 'large');
    // Only to a host the server trusts: the image field can hold any http(s) URL, and our domain must not redirect to one.
    if (cover && isServerImageUrl(cover)) fallback = cover;
    // Throws when the donor row should show but cannot be loaded: the current version is then unknown, so the fallback is used.
    const leaderboard = await loadShareLeaderboard(fundraiser);
    const version = shareImageVersion(fundraiser, origin, leaderboard);
    // A fundraiser also resolves by its GUID; its image lives at the slug.
    const canonicalSlug = fundraiser.slug || slug;
    if (
      query.get('v') !== version ||
      requested !== locale ||
      slug !== canonicalSlug
    ) {
      return redirectTo(
        new URL(shareImagePath(canonicalSlug, locale, version), origin),
        REDIRECT_CACHE
      );
    }

    const key = `${origin}:${slug}:${locale}:${version}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return imageResponse(cached);

    const image = await renderFundraiserShareImage(fundraiser, {
      locale,
      origin,
      leaderboard,
    });
    remember(key, image);
    return imageResponse(image);
  } catch (error) {
    console.error('[share-image] Falling back for', slug, error);
    // Never kept, so the next request tries the real image again.
    return redirectTo(new URL(fallback, origin), 'no-store');
  }
}

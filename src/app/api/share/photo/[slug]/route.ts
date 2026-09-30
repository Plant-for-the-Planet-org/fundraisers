import type { NextRequest } from 'next/server';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { NextResponse } from 'next/server';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getFundraisers } from '@/lib/api/fundraisers-service';
import { getLeaderboard } from '@/lib/api/leaderboard-service';
import { readImpersonation } from '@/lib/api/platform-fetch';
import { resolveShareBackground } from '@/lib/share/render/theme-background';
import { fetchAllowedImage } from '@/lib/share/server/fetch-image';
import {
  pickShareDonors,
  SHARE_LEADERBOARD_LIMIT,
} from '@/lib/share/share-data';
import { buildTheme } from '@/lib/theme/build-theme';
import { getImageUrl, resolveFundraiserImageSource } from '@/lib/utils/images';
import { routing } from '@/i18n/routing';

export const runtime = 'nodejs';

/**
 * A public or unlisted fundraiser needs no token.
 * A draft is not public yet, so it is looked up among the caller's own fundraisers, as the host they are or are impersonating.
 */
async function findFundraiser(
  request: NextRequest,
  slug: string
): Promise<Fundraiser | null> {
  const found = await getCachedFundraiser(slug, routing.defaultLocale).catch(
    () => null
  );
  if (found) return found;
  const token = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();
  if (!token) return null;
  // An expired or rejected token only means "not one of mine", never a failed request.
  const hosted = await getFundraisers(
    token,
    readImpersonation(request.headers)
  ).catch(() => []);
  return hosted.find(fundraiser => fundraiser.slug === slug) ?? null;
}

/**
 * Which image of this fundraiser to serve:
 * - by default, its cover photo;
 * - `?asset=background`: its theme's own background image or pattern, when that is on another host;
 * - `?donor=<donation id>`: the profile photo of a donor the share image names, by the rules of pickShareDonors.
 * Only URLs that belong to the fundraiser are ever fetched, never one from the request.
 */
async function resolveSource(
  request: NextRequest,
  slug: string
): Promise<string | null> {
  const { searchParams } = request.nextUrl;
  const donor = searchParams.get('donor');
  const [fundraiser, board] = await Promise.all([
    findFundraiser(request, slug),
    donor
      ? getLeaderboard(slug, SHARE_LEADERBOARD_LIMIT).catch(() => null)
      : null,
  ]);
  if (!fundraiser) return null;
  if (donor) {
    const person = pickShareDonors(fundraiser, board)?.people.find(
      entry => entry.seed === donor
    );
    return person?.avatarFile
      ? getImageUrl('profile', 'thumb', person.avatarFile)
      : null;
  }
  if (searchParams.get('asset') === 'background') {
    const src = resolveShareBackground(buildTheme(fundraiser.settings?.theme))
      .decoration?.src;
    // Library assets are served from our own origin already; fetchAllowedImage checks the host.
    return src && /^https:\/\//i.test(src) ? src : null;
  }
  return resolveFundraiserImageSource(fundraiser.image, 'large');
}

/**
 * A fundraiser's images, from our origin.
 * A canvas that draws an image from another origin can no longer be exported, and the CDN sends no CORS headers, so the share files load images through here.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/share/photo/[slug]'>
) {
  const { slug } = await params;
  try {
    const src = await resolveSource(request, slug);
    if (!src) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    // Raster types only: an SVG passed on would run as a page on our origin.
    const image = await fetchAllowedImage(src);
    if (!image)
      return NextResponse.json({ error: 'upstream' }, { status: 502 });

    return new NextResponse(new Uint8Array(image.bytes), {
      headers: {
        'Content-Type': image.type,
        // Only ever an image: never sniffed as something else, never run as a document.
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        // A draft's images are only for its hosts, and the browser cache does not key on the Authorization header.
        'Cache-Control': 'private, max-age=600',
      },
    });
  } catch (error) {
    console.error('[share-photo] Failed for', slug, error);
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}

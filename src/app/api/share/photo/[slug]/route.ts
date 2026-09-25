import type { NextRequest } from 'next/server';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { NextResponse } from 'next/server';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getFundraisers } from '@/lib/api/fundraisers-service';
import { getLeaderboard } from '@/lib/api/leaderboard-service';
import { readImpersonation } from '@/lib/api/platform-fetch';
import { resolveShareBackground } from '@/lib/share/render/theme-background';
import { fetchAllowedImage } from '@/lib/share/server/fetch-image';
import { buildTheme } from '@/lib/theme/build-theme';
import { getImageUrl, resolveFundraiserImageSource } from '@/lib/utils/images';
import { routing } from '@/i18n/routing';

export const runtime = 'nodejs';

// Big enough for a full-bleed background at 2x.
const MAX_RASTER_SIDE = 2400;

async function rasterize(
  svg: Buffer
): Promise<{ bytes: Buffer; type: string } | null> {
  const image = await loadImage(svg).catch(() => null);
  if (!image || !image.width || !image.height) return null;
  const scale = Math.min(
    1,
    MAX_RASTER_SIDE / Math.max(image.width, image.height)
  );
  const canvas = createCanvas(
    Math.round(image.width * scale),
    Math.round(image.height * scale)
  );
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return { bytes: await canvas.encode('png'), type: 'image/png' };
}

/**
 * A draft is not public yet, so it is looked up among the caller's own fundraisers, as the host they are or are impersonating.
 * A public or unlisted fundraiser needs no token.
 */
async function findFundraiser(
  request: NextRequest,
  slug: string
): Promise<Fundraiser | null> {
  const token = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();
  if (token) {
    const hosted = await getFundraisers(
      token,
      readImpersonation(request.headers)
    );
    const own = hosted.find(fundraiser => fundraiser.slug === slug);
    if (own) return own;
  }
  return getCachedFundraiser(slug, routing.defaultLocale).catch(() => null);
}

/**
 * Which image of this fundraiser to serve:
 * - by default, its cover photo;
 * - `?asset=background`: its theme's own background image or pattern, when that is on another host;
 * - `?donor=<donation id>`: the profile photo of a donor the public leaderboard names.
 * Only URLs that belong to the fundraiser are ever fetched, never one from the request.
 */
async function resolveSource(
  request: NextRequest,
  slug: string
): Promise<string | null> {
  const { searchParams } = request.nextUrl;
  const donor = searchParams.get('donor');
  if (donor) {
    const board = await getLeaderboard(slug, 20).catch(() => null);
    if (!board || board.settings?.anonymize) return null;
    const donation = [...(board?.top ?? []), ...(board?.recent ?? [])].find(
      entry => entry.id === donor && !entry.isAnonymous
    );
    return donation?.avatarUrl
      ? getImageUrl('profile', 'thumb', donation.avatarUrl)
      : null;
  }
  const fundraiser = await findFundraiser(request, slug);
  if (!fundraiser) return null;
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

    const image = await fetchAllowedImage(src, { allowSvg: true });
    if (!image)
      return NextResponse.json({ error: 'upstream' }, { status: 502 });
    // An SVG is drawn to a PNG here: passed on as it is, it would run as a page on our origin.
    const body =
      image.type === 'image/svg+xml'
        ? await rasterize(image.bytes)
        : { bytes: image.bytes, type: image.type };
    if (!body) return NextResponse.json({ error: 'upstream' }, { status: 502 });

    return new NextResponse(new Uint8Array(body.bytes), {
      headers: {
        'Content-Type': body.type,
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

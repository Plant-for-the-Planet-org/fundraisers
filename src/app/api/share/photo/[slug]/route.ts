import type { NextRequest } from 'next/server';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { NextResponse } from 'next/server';
import { getCachedFundraiser } from '@/lib/api/fundraiser-service';
import { getFundraisers } from '@/lib/api/fundraisers-service';
import { readImpersonation } from '@/lib/api/platform-fetch';
import { resolveFundraiserImageSource } from '@/lib/utils/images';
import { routing } from '@/i18n/routing';

const MAX_BYTES = 10 * 1024 * 1024;

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
 * The fundraiser's own cover photo, from our origin.
 * A canvas that draws an image from another origin can no longer be exported, and the CDN sends no CORS headers, so the share files load the photo through here.
 * It serves this fundraiser's image and nothing else, so it cannot be used to fetch other URLs.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/share/photo/[slug]'>
) {
  const { slug } = await params;
  try {
    const fundraiser = await findFundraiser(request, slug);
    const src = resolveFundraiserImageSource(fundraiser?.image, 'large');
    if (!src) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const upstream = await fetch(src, { signal: AbortSignal.timeout(8000) });
    const type = upstream.headers.get('content-type') ?? '';
    if (!upstream.ok || !type.startsWith('image/')) {
      return NextResponse.json({ error: 'upstream' }, { status: 502 });
    }
    const body = await upstream.arrayBuffer();
    if (body.byteLength > MAX_BYTES)
      return NextResponse.json({ error: 'too_large' }, { status: 502 });

    return new NextResponse(body, {
      headers: {
        'Content-Type': type,
        // A draft's photo is only for its hosts, and the browser cache does not key on the Authorization header.
        'Cache-Control': 'private, max-age=600',
      },
    });
  } catch (error) {
    console.error('[share-photo] Failed for', slug, error);
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}

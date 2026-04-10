import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import {
  unsplashService,
  UnsplashServiceError,
} from '@/lib/api/unsplash-service';

const MAX_COUNT = 50;
const MAX_PAGE = 10;
const CACHE_MAX_AGE_SECONDS = 2 * 60 * 60;
const STALE_WHILE_REVALIDATE_SECONDS = 24 * 60 * 60;

function clampNumber(
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  const parsedValue = Number.parseInt(value ?? '', 10);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(parsedValue, min), max);
}

function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  if (!host) {
    return true;
  }

  if (!origin && !referer) {
    return true;
  }

  try {
    if (origin && new URL(origin).host === host) {
      return true;
    }

    if (referer && new URL(referer).host === host) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function applyCacheHeaders(response: NextResponse): NextResponse {
  const cacheDisabled = process.env.DISABLE_UNSPLASH_CACHE === 'true';

  if (cacheDisabled) {
    response.headers.set(
      'Cache-Control',
      'no-cache, no-store, must-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  }

  response.headers.set(
    'Cache-Control',
    `public, max-age=${CACHE_MAX_AGE_SECONDS}, s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`
  );
  response.headers.set(
    'CDN-Cache-Control',
    `public, max-age=${CACHE_MAX_AGE_SECONDS}`
  );
  response.headers.set('Vary', 'Accept-Encoding');

  return response;
}

function getErrorStatus(error: unknown): number {
  if (error instanceof UnsplashServiceError && error.status) {
    return error.status;
  }

  return 500;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to fetch images from Unsplash.';
}

export async function GET(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!unsplashService.isAvailable()) {
    return NextResponse.json(
      { error: 'Unsplash service is not configured.' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'search') {
      const query = searchParams.get('query')?.trim();

      if (!query) {
        return NextResponse.json(
          { error: 'Query parameter is required for search.' },
          { status: 400 }
        );
      }

      const page = clampNumber(searchParams.get('page'), 1, 1, MAX_PAGE);
      const count = clampNumber(searchParams.get('count'), 20, 1, MAX_COUNT);
      const result = await unsplashService.searchPhotos(query, page, count);

      return applyCacheHeaders(NextResponse.json(result));
    }

    if (action === 'category') {
      const category = searchParams.get('category')?.trim();

      if (!category) {
        return NextResponse.json(
          { error: 'Category parameter is required.' },
          { status: 400 }
        );
      }

      const count = clampNumber(searchParams.get('count'), 20, 1, MAX_COUNT);
      const results = await unsplashService.getCategoryImages(category, count);

      return applyCacheHeaders(NextResponse.json({ results }));
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: search or category.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Unsplash API GET error:', error);

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!unsplashService.isAvailable()) {
    return NextResponse.json(
      { error: 'Unsplash service is not configured.' },
      { status: 503 }
    );
  }

  try {
    const payload = (await request.json()) as { downloadLocation?: string };
    const downloadLocation = payload.downloadLocation?.trim();

    if (!downloadLocation) {
      return NextResponse.json(
        { error: 'Download location is required.' },
        { status: 400 }
      );
    }

    await unsplashService.trackDownload(downloadLocation);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsplash API POST error:', error);

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}

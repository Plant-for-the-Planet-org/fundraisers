import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { unsplashService, UnsplashAPIError } from '@/lib/api/unsplash-service';

const MAX_COUNT = 50;
const DEFAULT_COUNT = 20;
const MAX_PAGE = 10;
const CACHE_MAX_AGE_SECONDS = 60 * 60 * 2; // 2 hours
const STALE_WHILE_REVALIDATE_SECONDS = 60 * 60 * 24; // 24 hours

function toInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function setCacheHeaders(response: NextResponse) {
  const cacheDisabled = process.env.DISABLE_UNSPLASH_CACHE === 'true';

  if (cacheDisabled) {
    response.headers.set('Cache-Control', 'no-store');
    return;
  }

  response.headers.set(
    'Cache-Control',
    `public, max-age=${CACHE_MAX_AGE_SECONDS}, s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`
  );
  response.headers.set('Vary', 'Accept-Encoding');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const count = Math.max(
    1,
    Math.min(toInt(searchParams.get('count'), DEFAULT_COUNT), MAX_COUNT)
  );
  const page = Math.max(
    1,
    Math.min(toInt(searchParams.get('page'), 1), MAX_PAGE)
  );

  if (!unsplashService.isAvailable()) {
    return jsonError(
      503,
      'SERVICE_UNAVAILABLE',
      'Unsplash service is not configured'
    );
  }

  try {
    if (action === 'category') {
      const category = searchParams.get('category');
      if (!category) {
        return jsonError(400, 'BAD_REQUEST', 'Category parameter is required');
      }

      const results = await unsplashService.getCategoryImages(category, count);
      const response = NextResponse.json({ results });
      setCacheHeaders(response);
      return response;
    }

    if (action === 'search') {
      const query = searchParams.get('query')?.trim();
      if (!query) {
        return jsonError(
          400,
          'BAD_REQUEST',
          'Query parameter is required for search'
        );
      }

      const result = await unsplashService.searchPhotos(query, page, count);
      const response = NextResponse.json(result);
      setCacheHeaders(response);
      return response;
    }

    return jsonError(
      400,
      'BAD_REQUEST',
      'Invalid action. Use: search or category'
    );
  } catch (error) {
    if (error instanceof UnsplashAPIError) {
      const status = error.status ?? 500;
      return jsonError(status, error.code, error.message);
    }

    return jsonError(
      500,
      'INTERNAL_ERROR',
      'Failed to fetch images from Unsplash'
    );
  }
}

export async function POST(request: NextRequest) {
  if (!unsplashService.isAvailable()) {
    return jsonError(
      503,
      'SERVICE_UNAVAILABLE',
      'Unsplash service is not configured'
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      downloadLocation?: unknown;
    } | null;

    const downloadLocation =
      typeof body?.downloadLocation === 'string'
        ? body.downloadLocation.trim()
        : '';

    if (!downloadLocation) {
      return jsonError(400, 'BAD_REQUEST', 'Download location is required');
    }

    await unsplashService.trackDownload(downloadLocation);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnsplashAPIError) {
      const status = error.status ?? 500;
      return jsonError(status, error.code, error.message);
    }

    return jsonError(500, 'INTERNAL_ERROR', 'Failed to track download');
  }
}

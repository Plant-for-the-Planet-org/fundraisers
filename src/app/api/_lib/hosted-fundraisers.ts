import type { NextRequest } from 'next/server';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { NextResponse } from 'next/server';
import { isUmamiStatsConfigured } from '@/lib/analytics/umami-stats';
import { getFundraisers } from '@/lib/api/fundraisers-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';

/**
 * The first steps every insights route takes: Umami is set up, the caller sent a platform token, and the platform lists the fundraisers they actively host.
 * Routes only ever query Umami for slugs from this list, never for a slug from the request alone.
 *
 * Returns the list, or the response to send back when a step fails.
 */
export async function getHostedFundraisersForInsights(
  request: NextRequest,
  label: string
): Promise<{ fundraisers: Fundraiser[] } | { response: NextResponse }> {
  if (!isUmamiStatsConfigured()) {
    return {
      response: NextResponse.json({ error: 'not_configured' }, { status: 503 }),
    };
  }

  const token = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();
  if (!token) {
    return {
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    };
  }

  try {
    return { fundraisers: await getFundraisers(token) };
  } catch (error) {
    if (
      error instanceof PlatformAPIError &&
      (error.status === 401 || error.status === 403)
    ) {
      return {
        response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
      };
    }
    console.error(`[${label}] Failed to list hosted fundraisers:`, error);
    return {
      response: NextResponse.json({ error: 'upstream' }, { status: 502 }),
    };
  }
}

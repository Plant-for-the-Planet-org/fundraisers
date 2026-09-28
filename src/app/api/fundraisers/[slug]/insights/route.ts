import type { NextRequest } from 'next/server';
import type { InsightsRange } from '@/lib/types/fundraiser-insights';

import { NextResponse } from 'next/server';
import { isValidTimeZone } from '@/lib/analytics/insights-buckets';
import { getFundraiserInsights } from '@/lib/analytics/umami-stats';
import { INSIGHTS_RANGES } from '@/lib/types/fundraiser-insights';
import { getHostedFundraisersForInsights } from '../../../_lib/hosted-fundraisers';

/** Page views and donation events for one fundraiser, for its hosts only. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<'/api/fundraisers/[slug]/insights'>
) {
  const { searchParams } = request.nextUrl;
  const range = searchParams.get('range') as InsightsRange | null;
  const timeZone = searchParams.get('tz') ?? 'UTC';
  if (
    !range ||
    !INSIGHTS_RANGES.includes(range) ||
    !isValidTimeZone(timeZone)
  ) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const hosted = await getHostedFundraisersForInsights(request, 'insights');
  if ('response' in hosted) return hosted.response;

  const { slug } = await params;
  const fundraiser = hosted.fundraisers.find(f => f.slug === slug);
  // Same answer for "not yours" and "does not exist", so the route cannot be used to probe slugs.
  if (!fundraiser) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  try {
    const insights = await getFundraiserInsights({
      slug: fundraiser.slug,
      range,
      timeZone,
      campaign: {
        startDate: fundraiser.startDate,
        endDate: fundraiser.endDate,
      },
    });
    if (!insights) {
      return NextResponse.json({ error: 'not_started' }, { status: 422 });
    }
    return NextResponse.json(insights, {
      // The answer depends on who is signed in, and the browser cache does not key on the Authorization header.
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[insights] Failed to load Umami stats:', error);
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}

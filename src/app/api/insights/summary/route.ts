import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { getWeeklyViewsForSlugs } from '@/lib/analytics/umami-stats';
import { getHostedFundraisersForInsights } from '../../_lib/hosted-fundraisers';

/** Page views this week across the caller's fundraisers (drafts have no public page), for the dashboard Overview. Same set as the Insights page. */
export async function GET(request: NextRequest) {
  const hosted = await getHostedFundraisersForInsights(
    request,
    'insights/summary'
  );
  if ('response' in hosted) return hosted.response;

  try {
    const views = await getWeeklyViewsForSlugs(
      hosted.fundraisers
        .filter(fundraiser => fundraiser.status !== 'draft')
        .map(fundraiser => fundraiser.slug)
    );
    return NextResponse.json(views, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch (error) {
    console.error('[insights/summary] Failed to load Umami stats:', error);
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}

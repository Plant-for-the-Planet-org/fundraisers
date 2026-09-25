import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';
import { getWeeklyVisitorsForSlugs } from '@/lib/analytics/umami-stats';
import { getHostedFundraisersForInsights } from '../../_lib/hosted-fundraisers';

/** Visitors this week across the caller's fundraisers (drafts have no public page), for the dashboard Overview. Same set as the Insights page. */
export async function GET(request: NextRequest) {
  const hosted = await getHostedFundraisersForInsights(
    request,
    'insights/summary'
  );
  if ('response' in hosted) return hosted.response;

  try {
    const visitors = await getWeeklyVisitorsForSlugs(
      hosted.fundraisers
        .filter(fundraiser => fundraiser.status !== 'draft')
        .map(fundraiser => fundraiser.slug)
    );
    return NextResponse.json(visitors, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[insights/summary] Failed to load Umami stats:', error);
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}

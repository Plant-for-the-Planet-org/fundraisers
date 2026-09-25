import type { NextRequest } from 'next/server';
import type {
  AccountInsights,
  InsightsRange,
} from '@/lib/types/fundraiser-insights';

import { NextResponse } from 'next/server';
import { isValidTimeZone } from '@/lib/analytics/insights-buckets';
import { getAccountInsights } from '@/lib/analytics/umami-stats';
import { deriveDisplayStatus, isLiveStatus } from '@/lib/utils/fundraiser-list';
import { getHostedFundraisersForInsights } from '../../_lib/hosted-fundraisers';

const ACCOUNT_RANGES: readonly InsightsRange[] = ['24h', '7d', '30d'];

/**
 * Visitors across every fundraiser the caller actively hosts, and a ranking of those fundraisers.
 *
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const range = searchParams.get('range') as InsightsRange | null;
  const timeZone = searchParams.get('tz') ?? 'UTC';
  if (
    !range ||
    range === 'campaign' ||
    !ACCOUNT_RANGES.includes(range) ||
    !isValidTimeZone(timeZone)
  ) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const hosted = await getHostedFundraisersForInsights(
    request,
    'insights/account'
  );
  if ('response' in hosted) return hosted.response;

  // Drafts have never had a public page, so they have nothing to count.
  const measured = hosted.fundraisers.filter(
    fundraiser => fundraiser.status !== 'draft'
  );

  try {
    const { visitorsBySlug, donorStepsBySlug, ...series } =
      await getAccountInsights({
        slugs: measured.map(fundraiser => fundraiser.slug),
        range,
        timeZone,
      });

    const body: AccountInsights = {
      ...series,
      fundraisers: measured
        .map(fundraiser => ({
          slug: fundraiser.slug,
          title: fundraiser.title,
          status: deriveDisplayStatus(fundraiser),
          startDate: fundraiser.startDate,
          visitors: visitorsBySlug[fundraiser.slug] ?? 0,
          clickedVisitors: donorStepsBySlug[fundraiser.slug]?.clicked ?? 0,
          submittedVisitors: donorStepsBySlug[fundraiser.slug]?.submitted ?? 0,
        }))
        // Live fundraisers first, since those are the ones a host can still act on; then by visitors.
        .sort(
          (a, b) =>
            Number(isLiveStatus(b.status)) - Number(isLiveStatus(a.status)) ||
            b.visitors - a.visitors
        ),
    };

    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('[insights/account] Failed to load Umami stats:', error);
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }
}

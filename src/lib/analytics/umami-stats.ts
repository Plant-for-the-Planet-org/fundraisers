import type {
  AccountInsights,
  DonationEventName,
  FundraiserInsights,
  InsightsBucket,
  InsightsRange,
} from '@/lib/types/fundraiser-insights';
import type { RangeWindow } from './insights-buckets';

import { isValidRefCode } from '@/lib/share/links';
import { DONATION_EVENTS } from '@/lib/types/fundraiser-insights';
import {
  buildBuckets,
  buildDayBucketsFromHours,
  getRangeWindow,
} from './insights-buckets';
import { mergeReferrals } from './referrals';
import { groupReferrers } from './referrer-sources';
import { getUmamiBaseUrl } from './umami';

import 'server-only';

const TOP_LIMIT = 6;

// Umami reads a comma in the path filter as "or this other path", so only well-formed slugs may reach it. Same pattern as the fundraiser form.
const SAFE_SLUG = /^[a-z0-9-]+$/;

function isSafeSlug(slug: string): boolean {
  return SAFE_SLUG.test(slug);
}

/**
 * Minutes per snapshot, by range. Numbers are a snapshot, not realtime.
 * The last 24 hours is what hosts watch live (say, during an event), so it refreshes every 5 minutes; longer ranges move slowly and refresh every 30, which keeps the load on Umami low.
 */
const SNAPSHOT_MINUTES: Record<InsightsRange, number> = {
  '24h': 5,
  '7d': 30,
  '30d': 30,
  campaign: 30,
};

/** The Overview's "Views this week". */
const WEEKLY_VIEWS_SNAPSHOT_MINUTES = 30;

/**
 * The window end, snapped to the last full snapshot, and how long Umami answers may be cached.
 * The window is part of the Umami URL and so the cache key: snapping keeps it the same for the whole snapshot, so every host viewing a fundraiser shares one answer, and the cache never outlives the window it describes.
 */
function snapshot(minutes: number) {
  const ms = minutes * 60_000;
  return { now: Math.floor(Date.now() / ms) * ms, revalidate: minutes * 60 };
}

interface UmamiSeriesResponse {
  pageviews: Array<{ x: string; y: number }>;
  sessions: Array<{ x: string; y: number }>;
}

interface UmamiStatsResponse {
  pageviews: number;
  visitors: number;
}

/** 7d asks Umami for hours and builds its day bars from them, so the bars can show when in the day people came. 30d would need 720 hours, too thin to read. */
function wantsHourlyDetail(range: InsightsRange) {
  return range === '7d';
}

function toBuckets(
  range: InsightsRange,
  window: RangeWindow,
  timeZone: string,
  series: UmamiSeriesResponse
): InsightsBucket[] {
  return wantsHourlyDetail(range)
    ? buildDayBucketsFromHours(
        window,
        timeZone,
        series.pageviews,
        series.sessions
      )
    : buildBuckets(window, timeZone, series.pageviews, series.sessions);
}

interface UmamiMetric {
  x: string;
  y: number;
}

const UMAMI_TIMEOUT_MS = 8000;

function getUmamiConfig() {
  const baseUrl = getUmamiBaseUrl();
  const apiKey = process.env.UMAMI_API_KEY;
  // A separate id lets a local or preview box read production stats without also sending its own visits there.
  // `||`, not `??`: `.env.example` ships the override as an empty line, which loads as ''.
  const websiteId =
    process.env.UMAMI_STATS_WEBSITE_ID?.trim() ||
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();

  if (!baseUrl || !apiKey || !websiteId) return null;
  return { baseUrl, apiKey, websiteId };
}

export function isUmamiStatsConfigured(): boolean {
  return getUmamiConfig() !== null;
}

async function umamiGet<T>(
  path: string,
  params: Record<string, string | number>,
  revalidate: number
): Promise<T> {
  const config = getUmamiConfig();
  if (!config) throw new Error('Umami stats are not configured');

  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  );
  const response = await fetch(
    `${config.baseUrl}/api/websites/${config.websiteId}/${path}?${query}`,
    {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      // A slow Umami should fail into the route's 502 and retry button, not hang the request.
      signal: AbortSignal.timeout(UMAMI_TIMEOUT_MS),
      // Opt-in is required: without force-cache, Next.js skips its cache for requests that send an authorization header.
      // The key is the URL plus headers. The key header is the same for everyone, and the snapped window keeps the URL stable, so hosts share one answer.
      cache: 'force-cache',
      next: { revalidate },
    }
  );

  if (!response.ok) {
    throw new Error(`Umami ${path} responded ${response.status}`);
  }
  return (await response.json()) as T;
}

/**
 * Views, visitors and donation events for one fundraiser page.
 *
 * Filters on `/raise/<slug>`, the one URL the fundraiser page is served at, so Umami counts every visit under a single path.
 * Donation events are sent from that same page, so the same filter scopes them to this fundraiser.
 */
export async function getFundraiserInsights({
  slug,
  range,
  timeZone,
  campaign,
}: {
  slug: string;
  range: InsightsRange;
  timeZone: string;
  campaign: { startDate: string; endDate: string };
}): Promise<FundraiserInsights | null> {
  const { now, revalidate } = snapshot(SNAPSHOT_MINUTES[range]);
  const window = getRangeWindow(range, now, timeZone, campaign);
  // Only the campaign range can be empty: it has not started yet.
  if (!window) return null;
  if (!isSafeSlug(slug)) throw new Error('Refusing an unexpected slug format');
  const path = `/raise/${slug}`;
  const base = { startAt: window.startAt, endAt: window.endAt, path };

  const [
    series,
    stats,
    previous,
    events,
    countries,
    referrers,
    channels,
    utmSources,
    refVisits,
    refDonations,
  ] = await Promise.all([
    umamiGet<UmamiSeriesResponse>(
      'pageviews',
      {
        ...base,
        unit: wantsHourlyDetail(range) ? 'hour' : window.unit,
        timezone: timeZone,
      },
      revalidate
    ),
    umamiGet<UmamiStatsResponse>('stats', base, revalidate),
    range === 'campaign'
      ? Promise.resolve<UmamiStatsResponse>({ pageviews: 0, visitors: 0 })
      : umamiGet<UmamiStatsResponse>(
          'stats',
          {
            startAt: window.startAt - (window.endAt - window.startAt),
            endAt: window.startAt,
            path,
          },
          revalidate
        ),
    umamiGet<UmamiMetric[]>('metrics', { ...base, type: 'event' }, revalidate),
    umamiGet<UmamiMetric[]>(
      'metrics',
      {
        ...base,
        type: 'country',
        limit: TOP_LIMIT,
      },
      revalidate
    ),
    // Fetch more than we show: several raw hosts fold into one source.
    umamiGet<UmamiMetric[]>(
      'metrics',
      {
        ...base,
        type: 'referrer',
        limit: 50,
      },
      revalidate
    ),
    umamiGet<UmamiMetric[]>(
      'metrics',
      { ...base, type: 'channel' },
      revalidate
    ),
    umamiGet<UmamiMetric[]>(
      'metrics',
      {
        ...base,
        type: 'utmSource',
        limit: TOP_LIMIT,
      },
      revalidate
    ),
    refCounts('share_visit', base, revalidate),
    refCounts('donation_completed', base, revalidate),
  ]);

  const eventCounts = Object.fromEntries(
    DONATION_EVENTS.map(name => [
      name,
      events.find(metric => metric.x === name)?.y ?? 0,
    ])
  ) as Record<DonationEventName, number>;

  return {
    range,
    unit: window.unit,
    startAt: window.startAt,
    endAt: window.endAt,
    endsNow: window.endAt === now,
    views: stats.pageviews,
    visitors: stats.visitors,
    previousViews: previous.pageviews,
    previousVisitors: previous.visitors,
    buckets: toBuckets(range, window, timeZone, series),
    events: eventCounts,
    countries: countries
      .filter(metric => /^[A-Z]{2}$/.test(metric.x))
      .map(metric => ({ code: metric.x, visitors: metric.y })),
    sources: groupReferrers(referrers, TOP_LIMIT),
    taggedSources: utmSources.map(metric => ({
      source: metric.x,
      visitors: metric.y,
    })),
    directVisitors: channels.find(metric => metric.x === 'direct')?.y ?? 0,
    referrals: mergeReferrals(refVisits, refDonations),
  };
}

/**
 * How often an event fired per `ref` code on one fundraiser page.
 * Optional on purpose: a Umami that cannot answer this leaves the rest of Insights intact, with no referrals.
 */
async function refCounts(
  event: 'share_visit' | 'donation_completed',
  base: { startAt: number; endAt: number; path: string },
  revalidate: number
): Promise<Record<string, number>> {
  try {
    const values = await umamiGet<Array<{ value: string; total: number }>>(
      'event-data/values',
      { ...base, event, propertyName: 'ref' },
      revalidate
    );
    // Anyone can type any ?ref= into a URL; only well-formed codes reach the host's Insights.
    return Object.fromEntries(
      values
        .filter(({ value }) => isValidRefCode(value))
        .map(({ value, total }) => [value, total])
    );
  } catch (error) {
    console.warn(`[insights] No ref counts for ${event}:`, error);
    return {};
  }
}

/**
 * Page views over the last 7 days, summed across several fundraiser pages, with the week before for comparison.
 *
 * One `path` metrics call per week covers every page at once, so the cost does not grow with the number of fundraisers.
 */
export async function getWeeklyViewsForSlugs(
  slugs: string[]
): Promise<{ views: number; previousViews: number }> {
  slugs = slugs.filter(isSafeSlug);
  if (slugs.length === 0) return { views: 0, previousViews: 0 };

  const { now, revalidate } = snapshot(WEEKLY_VIEWS_SNAPSHOT_MINUTES);
  const week = 7 * 24 * 60 * 60 * 1000;
  const wanted = new Set(slugs.map(slug => `/raise/${slug}`));

  const sumFor = async (startAt: number, endAt: number) => {
    // Well above the number of pages the site gets views on in a week, so no fundraiser page is cut off.
    const metrics = await umamiGet<UmamiMetric[]>(
      'metrics',
      {
        startAt,
        endAt,
        type: 'path',
        limit: 1000,
      },
      revalidate
    );
    return metrics
      .filter(metric => wanted.has(metric.x))
      .reduce((total, metric) => total + metric.y, 0);
  };

  const [views, previousViews] = await Promise.all([
    sumFor(now - week, now),
    sumFor(now - 2 * week, now - week),
  ]);
  return { views, previousViews };
}

/** Paths per Umami request, so a host with many fundraisers never produces an overlong URL. */
const PATHS_PER_REQUEST = 40;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** How many times an event fired per fundraiser slug, from the `fundraiser` property every donation event carries. */
async function eventCountsBySlug(
  event: 'donate_clicked' | 'donation_submitted',
  window: { startAt: number; endAt: number },
  revalidate: number
): Promise<Record<string, number>> {
  const values = await umamiGet<Array<{ value: string; total: number }>>(
    'event-data/values',
    {
      startAt: window.startAt,
      endAt: window.endAt,
      event,
      propertyName: 'fundraiser',
    },
    revalidate
  );
  return Object.fromEntries(values.map(({ value, total }) => [value, total]));
}

function pick(counts: Record<string, number>, slugs: Set<string>) {
  return Object.fromEntries(
    Object.entries(counts).filter(([slug]) => slugs.has(slug))
  );
}

function addSeries(
  target: Map<string, number>,
  points: Array<{ x: string; y: number }>
) {
  for (const { x, y } of points) target.set(x, (target.get(x) ?? 0) + y);
}

/**
 * Visitors across several fundraiser pages combined, plus views and donate clicks per fundraiser.
 *
 * Umami treats comma-separated paths as "any of these" and counts each visitor once across them, so one request covers a whole group of fundraisers.
 * Only when a host has more than PATHS_PER_REQUEST fundraisers are groups added together, and then a visitor who saw pages in two groups counts twice.
 */
export async function getAccountInsights({
  slugs,
  range,
  timeZone,
}: {
  slugs: string[];
  range: Exclude<InsightsRange, 'campaign'>;
  timeZone: string;
}): Promise<
  Omit<AccountInsights, 'fundraisers'> & {
    viewsBySlug: Record<string, number>;
    clicksBySlug: Record<string, number>;
    submissionsBySlug: Record<string, number>;
  }
> {
  const { now, revalidate } = snapshot(SNAPSHOT_MINUTES[range]);
  const window = getRangeWindow(range, now, timeZone)!;
  const previous = {
    startAt: window.startAt - (window.endAt - window.startAt),
    endAt: window.startAt,
  };
  slugs = slugs.filter(isSafeSlug);

  // Nothing to count: skip Umami entirely and return an empty series for the window.
  if (slugs.length === 0) {
    return {
      range,
      unit: window.unit,
      startAt: window.startAt,
      endAt: window.endAt,
      endsNow: true,
      views: 0,
      visitors: 0,
      previousViews: 0,
      previousVisitors: 0,
      buckets: toBuckets(range, window, timeZone, {
        pageviews: [],
        sessions: [],
      }),
      viewsBySlug: {},
      clicksBySlug: {},
      submissionsBySlug: {},
    };
  }

  const groups = chunk(
    slugs.map(slug => `/raise/${slug}`),
    PATHS_PER_REQUEST
  );

  const [groupResults, pathMetrics, clicksBySlug, submissionsBySlug] =
    await Promise.all([
      Promise.all(
        groups.map(paths => {
          const path = paths.join(',');
          const base = { startAt: window.startAt, endAt: window.endAt, path };
          return Promise.all([
            umamiGet<UmamiSeriesResponse>(
              'pageviews',
              {
                ...base,
                unit: wantsHourlyDetail(range) ? 'hour' : window.unit,
                timezone: timeZone,
              },
              revalidate
            ),
            umamiGet<UmamiStatsResponse>('stats', base, revalidate),
            umamiGet<UmamiStatsResponse>(
              'stats',
              { ...previous, path },
              revalidate
            ),
          ]);
        })
      ),
      // Views per page for the ranking: one request for the whole site, filtered here.
      umamiGet<UmamiMetric[]>(
        'metrics',
        {
          startAt: window.startAt,
          endAt: window.endAt,
          type: 'path',
          limit: 1000,
        },
        revalidate
      ),
      // Donation events carry the fundraiser slug, so one request per event counts it for every fundraiser.
      eventCountsBySlug('donate_clicked', window, revalidate),
      eventCountsBySlug('donation_submitted', window, revalidate),
    ]);

  const views = new Map<string, number>();
  const visitors = new Map<string, number>();
  let totalViews = 0;
  let totalVisitors = 0;
  let previousViews = 0;
  let previousVisitors = 0;
  for (const [series, stats, before] of groupResults) {
    addSeries(views, series.pageviews);
    addSeries(visitors, series.sessions);
    totalViews += stats.pageviews;
    totalVisitors += stats.visitors;
    previousViews += before.pageviews;
    previousVisitors += before.visitors;
  }

  const wanted = new Set(slugs);
  const viewsBySlug: Record<string, number> = {};
  for (const metric of pathMetrics) {
    const slug = metric.x.startsWith('/raise/') ? metric.x.slice(7) : null;
    if (slug && wanted.has(slug)) viewsBySlug[slug] = metric.y;
  }

  return {
    range,
    unit: window.unit,
    startAt: window.startAt,
    endAt: window.endAt,
    endsNow: true,
    views: totalViews,
    visitors: totalVisitors,
    previousViews,
    previousVisitors,
    buckets: toBuckets(range, window, timeZone, {
      pageviews: [...views].map(([x, y]) => ({ x, y })),
      sessions: [...visitors].map(([x, y]) => ({ x, y })),
    }),
    viewsBySlug,
    clicksBySlug: pick(clicksBySlug, wanted),
    submissionsBySlug: pick(submissionsBySlug, wanted),
  };
}

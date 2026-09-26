import type {
  AccountInsights,
  DonationEventName,
  FundraiserInsights,
  InsightsBucket,
  InsightsRange,
} from '@/lib/types/fundraiser-insights';
import type { RangeWindow } from './insights-buckets';

import { DONATION_EVENTS } from '@/lib/types/fundraiser-insights';
import {
  buildBuckets,
  buildDayBucketsFromHours,
  getRangeWindow,
} from './insights-buckets';
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

/** The Overview's "Visitors this week". */
const WEEKLY_VISITORS_SNAPSHOT_MINUTES = 30;

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

/** A `metrics/expanded` row. For events, `pageviews` is how often the event fired and `visitors` how many people sent it. Umami returns some counts as strings. */
interface UmamiExpandedMetric {
  name: string;
  visitors: number | string;
}

/** Visitors who sent each donation event, from a `metrics/expanded?type=event` answer. */
function toEventVisitors(
  metrics: UmamiExpandedMetric[]
): Record<DonationEventName, number> {
  return Object.fromEntries(
    DONATION_EVENTS.map(name => [
      name,
      Number(metrics.find(metric => metric.name === name)?.visitors ?? 0),
    ])
  ) as Record<DonationEventName, number>;
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
    // Expanded, for people per event rather than how often it fired.
    umamiGet<UmamiExpandedMetric[]>(
      'metrics/expanded',
      { ...base, type: 'event' },
      revalidate
    ),
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
  ]);

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
    eventVisitors: toEventVisitors(events),
    countries: countries
      .filter(metric => /^[A-Z]{2}$/.test(metric.x))
      .map(metric => ({ code: metric.x, visitors: metric.y })),
    sources: groupReferrers(referrers, TOP_LIMIT),
    taggedSources: utmSources.map(metric => ({
      source: metric.x,
      visitors: metric.y,
    })),
    directVisitors: channels.find(metric => metric.x === 'direct')?.y ?? 0,
  };
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

/**
 * Visitors over the last 7 days across several fundraiser pages, with the week before for comparison.
 *
 * Umami counts each visitor once across comma-separated paths, so someone who saw two of the pages counts once. Only above PATHS_PER_REQUEST fundraisers are groups added together.
 */
export async function getWeeklyVisitorsForSlugs(
  slugs: string[]
): Promise<{ visitors: number; previousVisitors: number }> {
  slugs = slugs.filter(isSafeSlug);
  if (slugs.length === 0) return { visitors: 0, previousVisitors: 0 };

  const { now, revalidate } = snapshot(WEEKLY_VISITORS_SNAPSHOT_MINUTES);
  const week = 7 * 24 * 60 * 60 * 1000;
  const groups = chunk(
    slugs.map(slug => `/raise/${slug}`),
    PATHS_PER_REQUEST
  );

  const sumFor = async (startAt: number, endAt: number) => {
    const results = await Promise.all(
      groups.map(paths =>
        umamiGet<UmamiStatsResponse>(
          'stats',
          { startAt, endAt, path: paths.join(',') },
          revalidate
        )
      )
    );
    return results.reduce((total, stats) => total + stats.visitors, 0);
  };

  const [visitors, previousVisitors] = await Promise.all([
    sumFor(now - week, now),
    sumFor(now - 2 * week, now - week),
  ]);
  return { visitors, previousVisitors };
}

/** Slugs that got this event in the window, from the `fundraiser` property every donation event carries. */
async function slugsWithEvent(
  event: 'donate_clicked' | 'donation_submitted',
  window: { startAt: number; endAt: number },
  revalidate: number
): Promise<string[]> {
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
  return values.map(({ value }) => value);
}

/**
 * Visitors who clicked Donate and who submitted, per fundraiser.
 *
 * Umami can only count people per event for one path filter at a time, so this asks once per fundraiser. Two site-wide calls first find the fundraisers that had any donation step, so fundraisers without one cost nothing.
 */
async function donorStepsBySlug(
  slugs: Set<string>,
  window: { startAt: number; endAt: number },
  revalidate: number
): Promise<Record<string, { clicked: number; submitted: number }>> {
  const [clicked, submitted] = await Promise.all([
    slugsWithEvent('donate_clicked', window, revalidate),
    slugsWithEvent('donation_submitted', window, revalidate),
  ]);
  const active = [...new Set([...clicked, ...submitted])].filter(
    slug => slugs.has(slug) && isSafeSlug(slug)
  );

  const entries = await Promise.all(
    active.map(async slug => {
      const events = toEventVisitors(
        await umamiGet<UmamiExpandedMetric[]>(
          'metrics/expanded',
          {
            startAt: window.startAt,
            endAt: window.endAt,
            path: `/raise/${slug}`,
            type: 'event',
          },
          revalidate
        )
      );
      return [
        slug,
        {
          clicked: events.donate_clicked,
          submitted: events.donation_submitted,
        },
      ] as const;
    })
  );
  return Object.fromEntries(entries);
}

function addSeries(
  target: Map<string, number>,
  points: Array<{ x: string; y: number }>
) {
  for (const { x, y } of points) target.set(x, (target.get(x) ?? 0) + y);
}

/**
 * Visitors across several fundraiser pages combined, plus visitors, donate clicks and submissions per fundraiser.
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
    visitorsBySlug: Record<string, number>;
    donorStepsBySlug: Record<string, { clicked: number; submitted: number }>;
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
      visitorsBySlug: {},
      donorStepsBySlug: {},
    };
  }

  const groups = chunk(
    slugs.map(slug => `/raise/${slug}`),
    PATHS_PER_REQUEST
  );

  const wanted = new Set(slugs);
  const [groupResults, pathMetrics, donorSteps] = await Promise.all([
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
    // Visitors per page for the ranking (the path metric counts visitors, not views): one request for the whole site, filtered here.
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
    donorStepsBySlug(wanted, window, revalidate),
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

  const visitorsBySlug: Record<string, number> = {};
  for (const metric of pathMetrics) {
    const slug = metric.x.startsWith('/raise/') ? metric.x.slice(7) : null;
    if (slug && wanted.has(slug)) visitorsBySlug[slug] = metric.y;
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
    visitorsBySlug,
    donorStepsBySlug: donorSteps,
  };
}

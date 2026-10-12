import type { FundraiserHost } from '@/lib/types/fundraiser';
import type {
  DonationEventName,
  FundraiserInsights,
  InsightsBucket,
  InsightsRange,
} from '@/lib/types/fundraiser-insights';

import { getReadableInk } from '@/lib/theme/color-utils';
import { INSIGHTS_RANGES } from '@/lib/types/fundraiser-insights';

/** Lists on the report show this many rows, then one "Other" row. */
const REPORT_LIST_LIMIT = 4;

/** With more bars than this, per-bar labels no longer fit, so the chart falls back to a few axis labels. */
export const MAX_LABELLED_BARS = 10;

const DEFAULT_RANGE: InsightsRange = '7d';

/** The range in the print link. Anything unknown falls back to 7 days, so a mistyped link still renders. */
export function parseReportRange(value: string | null | undefined) {
  return INSIGHTS_RANGES.find(range => range === value) ?? DEFAULT_RANGE;
}

export function splitTop<T>(rows: T[], limit: number = REPORT_LIST_LIMIT) {
  return { shown: rows.slice(0, limit), hidden: rows.slice(limit) };
}

/**
 * Visitors not covered by the shown countries.
 * The API only returns the top few countries, so summing the hidden ones would undercount. Taking it from the total also counts visitors whose country is unknown.
 */
export function otherCountryVisitors(
  visitors: number,
  shown: Array<{ visitors: number }>
) {
  const shownTotal = shown.reduce((sum, row) => sum + row.visitors, 0);
  return Math.max(0, visitors - shownTotal);
}

export interface SourceRow {
  key: string;
  /** The referring source, or null for the Direct row. */
  source: string | null;
  visitors: number;
}

/**
 * Where visitors came from, busiest first: the referring sources plus one Direct row when there were direct visitors.
 * Shared by the Insights tab and the PDF report, so the two always list the same sources. Each adds its own labels.
 */
export function rankedSources(
  data: Pick<FundraiserInsights, 'sources' | 'directVisitors'>
): SourceRow[] {
  return [
    ...data.sources.map(({ source, visitors }) => ({
      key: source,
      source,
      visitors,
    })),
    ...(data.directVisitors > 0
      ? [{ key: '__direct', source: null, visitors: data.directVisitors }]
      : []),
  ].sort((a, b) => b.visitors - a.visitors);
}

export function sumVisitors(rows: Array<{ visitors: number }>) {
  return rows.reduce((sum, row) => sum + row.visitors, 0);
}

/** Indexes of the axis labels to print under the chart: every bar when few, otherwise first, middle and last. */
export function axisLabelIndexes(count: number): number[] {
  if (count <= 0) return [];
  if (count <= MAX_LABELLED_BARS) {
    return Array.from({ length: count }, (_, index) => index);
  }
  return [0, Math.round((count - 1) / 2), count - 1];
}

/**
 * Indexes of the bars that get a printed value: every bar when few, only the busiest one when many.
 * Day bars built from hours (the 7 day range) add up hourly visitors, so a person who came back later that day counts twice and the numbers can add up to more than the Visitors tile. They get the busiest bar only, like long series.
 */
export function valueLabelIndexes(buckets: InsightsBucket[]): number[] {
  const builtFromHours = buckets.some(bucket => bucket.hourlyVisitors);
  if (buckets.length <= MAX_LABELLED_BARS && !builtFromHours) {
    return buckets.map((_, index) => index);
  }
  const peak = Math.max(...buckets.map(bucket => bucket.visitors));
  if (peak <= 0) return [];
  return [buckets.findIndex(bucket => bucket.visitors === peak)];
}

export interface HostsLine {
  /** Up to two names. */
  names: string[];
  /** How many more public hosts are not named. */
  others: number;
}

/**
 * The public, active hosts for the "by" line.
 * A host marked hidden from the public never appears, since the PDF is meant to be handed out.
 */
export function publicHostsLine(hosts: FundraiserHost[]): HostsLine {
  // Same order as the public page: displayOrder, nulls last, ties keep the incoming order.
  const names = hosts
    .filter(host => host.status === 'active' && host.isPublic)
    .map((host, index) => ({ host, index }))
    .sort((a, b) => {
      const first = a.host.displayOrder ?? Number.MAX_SAFE_INTEGER;
      const second = b.host.displayOrder ?? Number.MAX_SAFE_INTEGER;
      return first - second || a.index - b.index;
    })
    .map(
      ({ host }) => host.displayName?.trim() || host.user?.name?.trim() || ''
    )
    .filter(Boolean);
  return { names: names.slice(0, 2), others: Math.max(0, names.length - 2) };
}

type FunnelStepKey =
  | 'visited'
  | 'donate_clicked'
  | 'donation_submitted'
  | 'donation_completed';

export interface FunnelStep {
  key: FunnelStepKey;
  value: number;
  /** Share of visitors, 0 to 100. */
  percent: number;
}

/** Visitors, then the people who reached each donation step, each as a share of visitors. */
export function funnelSteps(
  visitors: number,
  eventVisitors: Record<DonationEventName, number>
): FunnelStep[] {
  const percentOf = (value: number) =>
    // Capped: an event near the window's start can belong to a visit whose page view fell just before it.
    visitors > 0 ? Math.min(Math.round((value / visitors) * 100), 100) : 0;

  return [
    { key: 'visited', value: visitors, percent: visitors > 0 ? 100 : 0 },
    ...(
      ['donate_clicked', 'donation_submitted', 'donation_completed'] as const
    ).map(key => ({
      key,
      value: eventVisitors[key],
      percent: percentOf(eventVisitors[key]),
    })),
  ];
}

/**
 * Progress towards the goal, like the Overview tab: `percent` is not capped, so a passed goal reads 180%. Only the bar stops at full, and it keeps a sliver when anything was raised so a tiny amount still shows.
 * Null when there is no goal.
 */
export function goalProgress(raised: number, goal: number) {
  if (!(goal > 0)) return null;
  const percent = Math.round((raised / goal) * 100);
  const bar = raised > 0 ? Math.min(100, Math.max(1, percent)) : 0;
  return { percent, bar };
}

/**
 * The accent darkened just enough to read as text on white (WCAG AA).
 * A pale accent such as a light pink fails as text, so it is mixed towards black in small steps. An accent that already passes is returned as it is.
 */
export function readableInk(accent: string): string {
  return getReadableInk(accent, '#ffffff');
}

/**
 * The link the QR code opens: the fundraiser page, tagged so visits from a printed report show up as their own source in Insights.
 * Same shape as the Share tab links: a source and a medium.
 */
export function reportLink(origin: string, slug: string) {
  const query = new URLSearchParams({
    utm_source: 'report',
    utm_medium: 'print',
  });
  return `${origin}/raise/${encodeURIComponent(slug)}?${query}`;
}

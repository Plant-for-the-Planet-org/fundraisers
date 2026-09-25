export type InsightsRange = '24h' | '7d' | '30d' | 'campaign';

export const INSIGHTS_RANGES: readonly InsightsRange[] = [
  '24h',
  '7d',
  '30d',
  'campaign',
];

export type InsightsUnit = 'hour' | 'day' | 'month';

/** The donation events we send to Umami, in the order a donor meets them. */
export const DONATION_EVENTS = [
  'donate_clicked',
  'donation_submitted',
  'donation_completed',
  'donation_exited',
  'donation_failed',
] as const;

export type DonationEventName = (typeof DONATION_EVENTS)[number];

export interface InsightsBucket {
  /** Local month (`YYYY-MM`), date (`YYYY-MM-DD`) or hour (`YYYY-MM-DDTHH`) in the viewer's timezone. */
  key: string;
  views: number;
  visitors: number;
  /** Visitors per local hour of this day, 7-day range only, drawn inside the day bar to show when in the day people came. */
  hourlyVisitors?: number[];
}

export interface InsightsCountry {
  /** ISO 3166-1 alpha-2, as Umami reports it. */
  code: string;
  visitors: number;
}

export interface InsightsSource {
  /** A known platform key (linkedin, instagram…) or the referring domain. */
  source: string;
  known: boolean;
  visitors: number;
}

/** A visitors series over one time window: shared by a single fundraiser's Insights and the account-wide Insights page. */
export interface InsightsSeries {
  range: InsightsRange;
  unit: InsightsUnit;
  /** The exact window counted, in epoch milliseconds, so the page can show which dates it covers. */
  startAt: number;
  endAt: number;
  /** True when the window ends now rather than at the campaign's end date. */
  endsNow: boolean;
  views: number;
  visitors: number;
  /** The same numbers for the period just before, for a change indicator. Zero for the campaign range, which has nothing before it to compare with. */
  previousViews: number;
  previousVisitors: number;
  buckets: InsightsBucket[];
}

export interface FundraiserInsights extends InsightsSeries {
  events: Record<DonationEventName, number>;
  countries: InsightsCountry[];
  sources: InsightsSource[];
  /** Visitors who arrived through a link with `utm_source`, by that value. */
  taggedSources: Array<{ source: string; visitors: number }>;
  /** Visitors with no referrer: typed or pasted links, and apps like WhatsApp that do not send one. */
  directVisitors: number;
  /** Visits and donations that came through personal share links, by the sharer's code. */
  referrals: InsightsReferral[];
}

export interface InsightsReferral {
  /** The sharer's code from `?ref=`. */
  ref: string;
  visits: number;
  donations: number;
}

export interface AccountInsightsFundraiser {
  slug: string;
  title: string;
  status: 'active' | 'draft' | 'paused' | 'ended' | 'ending-soon';
  /** For the single-fundraiser view, which offers the campaign range once a fundraiser has started. */
  startDate: string;
  views: number;
  donateClicks: number;
  donateSubmissions: number;
}

/** Every fundraiser the caller actively hosts, combined, plus a per-fundraiser ranking. */
export interface AccountInsights extends InsightsSeries {
  fundraisers: AccountInsightsFundraiser[];
}

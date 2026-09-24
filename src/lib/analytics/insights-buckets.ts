import type {
  InsightsBucket,
  InsightsRange,
  InsightsUnit,
} from '@/lib/types/fundraiser-insights';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Past this, daily bars get too thin to read, so a campaign is shown by month. */
const MAX_DAILY_SPAN = 90 * DAY;

const ROLLING_RANGES: Record<
  Exclude<InsightsRange, 'campaign'>,
  { durationMs: number; unit: InsightsUnit }
> = {
  '24h': { durationMs: DAY, unit: 'hour' },
  '7d': { durationMs: 7 * DAY, unit: 'day' },
  '30d': { durationMs: 30 * DAY, unit: 'day' },
};

export interface RangeWindow {
  startAt: number;
  endAt: number;
  unit: InsightsUnit;
}

/**
 * The time window for a range.
 * `campaign` runs from the fundraiser's start date to its end date, or to now while it is still running. It returns null when the campaign has not started yet.
 */
export function getRangeWindow(
  range: InsightsRange,
  now: number,
  campaign?: { startDate: string; endDate: string }
): RangeWindow | null {
  if (range !== 'campaign') {
    const { durationMs, unit } = ROLLING_RANGES[range];
    return { startAt: now - durationMs, endAt: now, unit };
  }

  const startAt = campaign ? new Date(campaign.startDate).getTime() : NaN;
  const end = campaign ? new Date(campaign.endDate).getTime() : NaN;
  if (!Number.isFinite(startAt) || startAt >= now) return null;
  const endAt = Number.isFinite(end) ? Math.min(end, now) : now;

  return {
    startAt,
    endAt,
    unit: endAt - startAt > MAX_DAILY_SPAN ? 'month' : 'day',
  };
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

function localKey(time: number, unit: InsightsUnit, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(time)
      .map(part => [part.type, part.value])
  );
  if (unit === 'month') return `${parts.year}-${parts.month}`;
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return unit === 'day' ? date : `${date}T${parts.hour}`;
}

/**
 * Umami labels each bucket with the local time in the requested timezone, but writes it with a `Z` as if it were UTC.
 * So the label is matched on its date (and hour) text, never parsed as a real UTC instant.
 */
const KEY_LENGTH: Record<InsightsUnit, number> = {
  month: 7,
  day: 10,
  hour: 13,
};

export function umamiLabelToKey(label: string, unit: InsightsUnit) {
  return label.slice(0, KEY_LENGTH[unit]);
}

/** Every bucket in the window, in order, with zeros where Umami returned nothing. */
export function buildBuckets(
  window: RangeWindow,
  timeZone: string,
  views: Array<{ x: string; y: number }>,
  visitors: Array<{ x: string; y: number }>
): InsightsBucket[] {
  const { startAt, endAt, unit } = window;
  const viewsByKey = new Map(
    views.map(point => [umamiLabelToKey(point.x, unit), point.y])
  );
  const visitorsByKey = new Map(
    visitors.map(point => [umamiLabelToKey(point.x, unit), point.y])
  );

  const keys: string[] = [];
  // Hour steps handle days that are 23 or 25 hours long around daylight saving. Months are long enough to step a day at a time.
  const step = unit === 'month' ? DAY : HOUR;
  for (let time = startAt; time <= endAt; time += step) {
    const key = localKey(time, unit, timeZone);
    if (keys[keys.length - 1] !== key) keys.push(key);
  }
  const lastKey = localKey(endAt, unit, timeZone);
  if (keys[keys.length - 1] !== lastKey) keys.push(lastKey);

  return keys.map(key => ({
    key,
    views: viewsByKey.get(key) ?? 0,
    visitors: visitorsByKey.get(key) ?? 0,
  }));
}

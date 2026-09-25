import type {
  InsightsBucket,
  InsightsRange,
  InsightsUnit,
} from '@/lib/types/fundraiser-insights';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Past this, daily bars get too thin to read, so a campaign is shown by month. */
const MAX_DAILY_SPAN = 90 * DAY;

/** Day ranges cover today plus the full days before it, so 7d shows exactly 7 bars rather than 8 with half a day at each end. */
const DAY_RANGES: Record<'7d' | '30d', number> = { '7d': 7, '30d': 30 };

export interface RangeWindow {
  startAt: number;
  endAt: number;
  unit: InsightsUnit;
}

/** Milliseconds the timezone is ahead of UTC at a given moment. */
function timeZoneOffset(time: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(time)
      .map(part => [part.type, Number(part.value)])
  );
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute
  );
  return asUtc - Math.floor(time / 60_000) * 60_000;
}

/** Local midnight, `daysBack` calendar days before the day `now` falls on in the timezone. */
function localMidnight(now: number, daysBack: number, timeZone: string) {
  const [year, month, day] = localKey(now, 'day', timeZone)
    .split('-')
    .map(Number);
  const midnightAsUtc = Date.UTC(year, month - 1, day - daysBack);
  const guess = midnightAsUtc - timeZoneOffset(midnightAsUtc, timeZone);
  // Checked again at the result, in case a daylight saving change falls in between.
  return midnightAsUtc - timeZoneOffset(guess, timeZone);
}

/**
 * The time window for a range.
 * `24h` is the rolling last 24 hours. `7d` and `30d` start at local midnight, so every bar is a whole calendar day except today's.
 * `campaign` runs from the fundraiser's start date to its end date, or to now while it is still running. It returns null when the campaign has not started yet.
 */
export function getRangeWindow(
  range: InsightsRange,
  now: number,
  timeZone: string,
  campaign?: { startDate: string; endDate: string }
): RangeWindow | null {
  if (range === '24h') return { startAt: now - DAY, endAt: now, unit: 'hour' };
  if (range !== 'campaign') {
    return {
      startAt: localMidnight(now, DAY_RANGES[range] - 1, timeZone),
      endAt: now,
      unit: 'day',
    };
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

/**
 * Day buckets built from an hourly series, for the 7-day range: one Umami request gives both the day bars and the hours drawn inside them.
 * Views add up exactly. Visitors are summed per hour, so someone who comes back later the same day counts again; the headline totals come from Umami's own count and stay exact.
 * Each day gets 24 hourly slots indexed by clock hour, so slot 19 is always 19:00. Hours still to come today, and the hour skipped when summer time starts, stay at zero. When summer time ends, the repeated hour shares one label, as it does in Umami's series.
 */
export function buildDayBucketsFromHours(
  window: Pick<RangeWindow, 'startAt' | 'endAt'>,
  timeZone: string,
  views: Array<{ x: string; y: number }>,
  visitors: Array<{ x: string; y: number }>
): InsightsBucket[] {
  const viewsByHour = new Map(
    views.map(point => [umamiLabelToKey(point.x, 'hour'), point.y])
  );
  const visitorsByHour = new Map(
    visitors.map(point => [umamiLabelToKey(point.x, 'hour'), point.y])
  );

  const days: Required<InsightsBucket>[] = [];
  let lastHour = '';
  const addHour = (hour: string) => {
    if (hour === lastHour) return;
    lastHour = hour;
    const key = hour.slice(0, 10);
    if (days[days.length - 1]?.key !== key) {
      days.push({
        key,
        views: 0,
        visitors: 0,
        hourlyVisitors: Array(24).fill(0),
      });
    }
    const day = days[days.length - 1]!;
    const hourVisitors = visitorsByHour.get(hour) ?? 0;
    day.views += viewsByHour.get(hour) ?? 0;
    day.visitors += hourVisitors;
    day.hourlyVisitors[Number(hour.slice(11, 13))] = hourVisitors;
  };

  for (let time = window.startAt; time <= window.endAt; time += HOUR) {
    addHour(localKey(time, 'hour', timeZone));
  }
  addHour(localKey(window.endAt, 'hour', timeZone));
  return days;
}

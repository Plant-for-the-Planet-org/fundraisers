import { describe, expect, it } from 'vitest';
import {
  buildBuckets,
  buildDayBucketsFromHours,
  getRangeWindow,
  isValidTimeZone,
  umamiLabelToKey,
} from './insights-buckets';

const NOW = Date.UTC(2026, 8, 24, 18, 30); // 24 Sep 2026, 18:30 UTC

describe('buildBuckets', () => {
  it('returns one bucket per local day for 7 days, filling gaps with zeros', () => {
    const window = getRangeWindow('7d', NOW, 'Europe/Berlin')!;
    const buckets = buildBuckets(
      window,
      'Europe/Berlin',
      [{ x: '2026-09-22T00:00:00Z', y: 3 }],
      [{ x: '2026-09-22T00:00:00Z', y: 2 }]
    );

    expect(buckets.map(b => b.key)).toEqual([
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
    ]);
    expect(buckets.find(b => b.key === '2026-09-22')).toEqual({
      key: '2026-09-22',
      views: 3,
      visitors: 2,
    });
    expect(buckets.filter(b => b.views === 0)).toHaveLength(6);
  });

  it('keys hourly buckets by local hour in the viewer timezone', () => {
    const window = getRangeWindow('24h', NOW, 'Asia/Kathmandu')!;
    const buckets = buildBuckets(window, 'Asia/Kathmandu', [], []);

    // 18:30 UTC is 00:15 the next day in Kathmandu (UTC+5:45).
    expect(buckets[buckets.length - 1]?.key).toBe('2026-09-25T00');
    expect(buckets.length).toBeGreaterThanOrEqual(24);
  });
});

describe('day ranges', () => {
  it('start 7d at local midnight six days back, so it has exactly 7 days', () => {
    const window = getRangeWindow('7d', NOW, 'Europe/Berlin')!;
    // Midnight on 18 Sep in Berlin (UTC+2) is 22:00 UTC the day before.
    expect(window).toEqual({
      startAt: Date.UTC(2026, 8, 17, 22),
      endAt: NOW,
      unit: 'day',
    });
  });

  it('gives 30d exactly 30 days', () => {
    const window = getRangeWindow('30d', NOW, 'America/New_York')!;
    expect(buildBuckets(window, 'America/New_York', [], [])).toHaveLength(30);
  });

  it('finds the right midnight across a daylight saving change', () => {
    // Berlin leaves summer time on 25 Oct 2026, so 20 Oct is still UTC+2.
    const now = Date.UTC(2026, 9, 26, 10);
    const window = getRangeWindow('7d', now, 'Europe/Berlin')!;
    expect(window.startAt).toBe(Date.UTC(2026, 9, 19, 22));
    expect(buildBuckets(window, 'Europe/Berlin', [], [])).toHaveLength(7);
  });
});

describe('buildDayBucketsFromHours', () => {
  it('sums hours into days and keeps each hour for the day bar', () => {
    const window = getRangeWindow('7d', NOW, 'Europe/Berlin')!;
    const buckets = buildDayBucketsFromHours(
      window,
      'Europe/Berlin',
      [
        { x: '2026-09-22T09:00:00Z', y: 4 },
        { x: '2026-09-22T19:00:00Z', y: 6 },
      ],
      [
        { x: '2026-09-22T09:00:00Z', y: 1 },
        { x: '2026-09-22T19:00:00Z', y: 3 },
      ]
    );

    expect(buckets.map(b => b.key)).toEqual(
      buildBuckets(window, 'Europe/Berlin', [], []).map(b => b.key)
    );
    const day = buckets.find(b => b.key === '2026-09-22')!;
    expect(day.views).toBe(10);
    expect(day.visitors).toBe(4);
    expect(day.hourlyVisitors).toHaveLength(24);
    expect(day.hourlyVisitors?.[9]).toBe(1);
    expect(day.hourlyVisitors?.[19]).toBe(3);
    // Today still has 24 slots; the hours after the 20:30 snapshot are empty.
    expect(buckets[buckets.length - 1]?.hourlyVisitors).toHaveLength(24);
  });

  it('keeps slots on clock hours when summer time starts', () => {
    const now = Date.UTC(2026, 2, 30, 10);
    const window = getRangeWindow('7d', now, 'Europe/Berlin')!;
    const buckets = buildDayBucketsFromHours(
      window,
      'Europe/Berlin',
      [],
      [{ x: '2026-03-29T19:00:00Z', y: 5 }]
    );
    // 02:00 does not exist that day, yet 19:00 stays in slot 19.
    const day = buckets.find(b => b.key === '2026-03-29')!;
    expect(day.hourlyVisitors).toHaveLength(24);
    expect(day.hourlyVisitors?.[2]).toBe(0);
    expect(day.hourlyVisitors?.[19]).toBe(5);
  });
});

describe('campaign range', () => {
  it('runs from the start date to now while the campaign is live', () => {
    const window = getRangeWindow('campaign', NOW, 'Europe/Berlin', {
      startDate: '2026-09-01T00:00:00Z',
      endDate: '2027-09-01T00:00:00Z',
    });
    expect(window).toEqual({
      startAt: Date.UTC(2026, 8, 1),
      endAt: NOW,
      unit: 'day',
    });
  });

  it('switches to months for a long campaign and stops at its end date', () => {
    const window = getRangeWindow('campaign', NOW, 'Europe/Berlin', {
      startDate: '2022-01-20T00:00:00Z',
      endDate: '2023-01-20T00:00:00Z',
    })!;
    expect(window.unit).toBe('month');
    expect(window.endAt).toBe(Date.UTC(2023, 0, 20));

    const buckets = buildBuckets(
      window,
      'Europe/Berlin',
      [{ x: '2022-03-01T00:00:00Z', y: 5 }],
      []
    );
    expect(buckets[0]?.key).toBe('2022-01');
    expect(buckets[buckets.length - 1]?.key).toBe('2023-01');
    expect(buckets).toHaveLength(13);
    expect(buckets.find(b => b.key === '2022-03')?.views).toBe(5);
  });

  it('returns nothing before the campaign starts', () => {
    expect(
      getRangeWindow('campaign', NOW, 'Europe/Berlin', {
        startDate: '2027-01-01T00:00:00Z',
        endDate: '2027-06-01T00:00:00Z',
      })
    ).toBeNull();
  });
});

describe('umamiLabelToKey', () => {
  it('reads the label as local text, not as a UTC instant', () => {
    expect(umamiLabelToKey('2026-09-24T08:00:00Z', 'hour')).toBe(
      '2026-09-24T08'
    );
    expect(umamiLabelToKey('2026-09-24T00:00:00Z', 'day')).toBe('2026-09-24');
  });
});

describe('isValidTimeZone', () => {
  it('accepts IANA names and rejects anything else', () => {
    expect(isValidTimeZone('Europe/Berlin')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
  });
});

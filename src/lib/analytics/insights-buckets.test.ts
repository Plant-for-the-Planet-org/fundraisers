import { describe, expect, it } from 'vitest';
import {
  buildBuckets,
  getRangeWindow,
  isValidTimeZone,
  umamiLabelToKey,
} from './insights-buckets';

const NOW = Date.UTC(2026, 8, 24, 18, 30); // 24 Sep 2026, 18:30 UTC

describe('buildBuckets', () => {
  it('returns one bucket per local day for 7 days, filling gaps with zeros', () => {
    const window = getRangeWindow('7d', NOW)!;
    const buckets = buildBuckets(
      window,
      'Europe/Berlin',
      [{ x: '2026-09-22T00:00:00Z', y: 3 }],
      [{ x: '2026-09-22T00:00:00Z', y: 2 }]
    );

    expect(buckets.map(b => b.key)).toEqual([
      '2026-09-17',
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
    expect(buckets.filter(b => b.views === 0)).toHaveLength(7);
  });

  it('keys hourly buckets by local hour in the viewer timezone', () => {
    const window = getRangeWindow('24h', NOW)!;
    const buckets = buildBuckets(window, 'Asia/Kathmandu', [], []);

    // 18:30 UTC is 00:15 the next day in Kathmandu (UTC+5:45).
    expect(buckets[buckets.length - 1]?.key).toBe('2026-09-25T00');
    expect(buckets.length).toBeGreaterThanOrEqual(24);
  });
});

describe('campaign range', () => {
  it('runs from the start date to now while the campaign is live', () => {
    const window = getRangeWindow('campaign', NOW, {
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
    const window = getRangeWindow('campaign', NOW, {
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
      getRangeWindow('campaign', NOW, {
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

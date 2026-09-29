import type { FundraiserHost } from '@/lib/types/fundraiser';

import { describe, expect, it } from 'vitest';
import { getContrastRatio, MIN_TEXT_CONTRAST } from '@/lib/theme/color-utils';
import {
  axisLabelIndexes,
  funnelSteps,
  goalProgress,
  otherCountryVisitors,
  parseReportRange,
  publicHostsLine,
  readableInk,
  reportLink,
  splitTop,
  sumVisitors,
  valueLabelIndexes,
} from './insights-report';

const bucket = (visitors: number) => ({ key: 'k', views: visitors, visitors });

function host(overrides: Partial<FundraiserHost>): FundraiserHost {
  return {
    id: 'h',
    user: null,
    hostType: 'user',
    role: 'admin',
    isPublic: true,
    displayName: null,
    displayOrder: null,
    status: 'active',
    invitedEmail: null,
    ...overrides,
  } as FundraiserHost;
}

describe('parseReportRange', () => {
  it('keeps a known range', () => {
    expect(parseReportRange('30d')).toBe('30d');
    expect(parseReportRange('campaign')).toBe('campaign');
  });

  it('falls back to 7 days for anything else', () => {
    expect(parseReportRange('90d')).toBe('7d');
    expect(parseReportRange('')).toBe('7d');
    expect(parseReportRange(null)).toBe('7d');
    expect(parseReportRange(undefined)).toBe('7d');
  });
});

describe('splitTop', () => {
  it('splits into shown and hidden rows', () => {
    const { shown, hidden } = splitTop([1, 2, 3, 4, 5, 6]);
    expect(shown).toEqual([1, 2, 3, 4]);
    expect(hidden).toEqual([5, 6]);
  });

  it('has nothing hidden for a short list', () => {
    expect(splitTop([1, 2])).toEqual({ shown: [1, 2], hidden: [] });
  });
});

describe('otherCountryVisitors', () => {
  it('is the visitors the shown countries do not cover', () => {
    const shown = [
      { visitors: 47 },
      { visitors: 34 },
      { visitors: 9 },
      { visitors: 6 },
    ];
    expect(otherCountryVisitors(109, shown)).toBe(13);
  });

  it('never goes below zero', () => {
    expect(otherCountryVisitors(5, [{ visitors: 4 }, { visitors: 4 }])).toBe(0);
  });
});

describe('sumVisitors', () => {
  it('adds up rows', () => {
    expect(sumVisitors([{ visitors: 2 }, { visitors: 3 }])).toBe(5);
    expect(sumVisitors([])).toBe(0);
  });
});

describe('axisLabelIndexes', () => {
  it('labels every bar when there are few', () => {
    expect(axisLabelIndexes(7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(axisLabelIndexes(10)).toHaveLength(10);
  });

  it('labels first, middle and last when there are many', () => {
    expect(axisLabelIndexes(30)).toEqual([0, 15, 29]);
    expect(axisLabelIndexes(11)).toEqual([0, 5, 10]);
  });

  it('has no labels without bars', () => {
    expect(axisLabelIndexes(0)).toEqual([]);
  });
});

describe('valueLabelIndexes', () => {
  it('prints every value when there are few bars', () => {
    expect(valueLabelIndexes([bucket(0), bucket(3), bucket(1)])).toEqual([
      0, 1, 2,
    ]);
  });

  it('prints only the busiest bar when there are many', () => {
    const buckets = Array.from({ length: 30 }, (_, i) =>
      bucket(i === 2 ? 40 : 1)
    );
    expect(valueLabelIndexes(buckets)).toEqual([2]);
  });

  it('picks the first when several bars tie for busiest', () => {
    const buckets = Array.from({ length: 12 }, (_, i) =>
      bucket(i === 3 || i === 8 ? 5 : 0)
    );
    expect(valueLabelIndexes(buckets)).toEqual([3]);
  });

  it('prints only the busiest bar when days are built from hours', () => {
    const days = [2, 5, 1, 0, 3, 1, 1].map(visitors => ({
      ...bucket(visitors),
      hourlyVisitors: Array(24).fill(0),
    }));
    expect(valueLabelIndexes(days)).toEqual([1]);
  });

  it('prints nothing when many bars are all empty', () => {
    expect(
      valueLabelIndexes(Array.from({ length: 30 }, () => bucket(0)))
    ).toEqual([]);
  });
});

describe('publicHostsLine', () => {
  it('names public active hosts only', () => {
    const line = publicHostsLine([
      host({ displayName: 'Rana Seymen' }),
      host({ displayName: 'Hidden Person', isPublic: false }),
      host({ displayName: 'Invited Person', status: 'invited' }),
    ]);
    expect(line).toEqual({ names: ['Rana Seymen'], others: 0 });
  });

  it('names two and counts the rest', () => {
    const line = publicHostsLine([
      host({ displayName: 'A' }),
      host({ displayName: 'B' }),
      host({ displayName: 'C' }),
      host({ displayName: 'D' }),
    ]);
    expect(line).toEqual({ names: ['A', 'B'], others: 2 });
  });

  it('falls back to the user name and skips hosts with no name', () => {
    const line = publicHostsLine([
      host({ user: { name: 'From Profile' } as FundraiserHost['user'] }),
      host({ displayName: '  ' }),
    ]);
    expect(line).toEqual({ names: ['From Profile'], others: 0 });
  });

  it('follows displayOrder, with unset orders last and ties in incoming order', () => {
    const line = publicHostsLine([
      host({ displayName: 'Unset' }),
      host({ displayName: 'Third', displayOrder: 2 }),
      host({ displayName: 'First', displayOrder: 0 }),
      host({ displayName: 'Second', displayOrder: 1 }),
    ]);
    expect(line).toEqual({ names: ['First', 'Second'], others: 2 });

    const ties = publicHostsLine([
      host({ displayName: 'B', displayOrder: 1 }),
      host({ displayName: 'A', displayOrder: 1 }),
    ]);
    expect(ties.names).toEqual(['B', 'A']);
  });

  it('is empty when nobody is public', () => {
    expect(
      publicHostsLine([host({ isPublic: false, displayName: 'X' })])
    ).toEqual({
      names: [],
      others: 0,
    });
  });
});

describe('funnelSteps', () => {
  const events = {
    donate_clicked: 13,
    donation_submitted: 8,
    donation_completed: 0,
    donation_exited: 2,
    donation_failed: 1,
  };

  it('starts with visitors and gives each step a share of them', () => {
    expect(funnelSteps(109, events)).toEqual([
      { key: 'visited', value: 109, percent: 100 },
      { key: 'donate_clicked', value: 13, percent: 12 },
      { key: 'donation_submitted', value: 8, percent: 7 },
      { key: 'donation_completed', value: 0, percent: 0 },
    ]);
  });

  it('caps a share at 100', () => {
    const steps = funnelSteps(4, { ...events, donate_clicked: 5 });
    expect(steps[1]!.percent).toBe(100);
  });

  it('shows zero shares when there are no visitors', () => {
    const steps = funnelSteps(0, events);
    expect(steps.map(step => step.percent)).toEqual([0, 0, 0, 0]);
  });
});

describe('goalProgress', () => {
  it('is null without a goal', () => {
    expect(goalProgress(100, 0)).toBeNull();
  });

  it('gives the honest percent', () => {
    expect(goalProgress(140, 500)).toEqual({ percent: 28, bar: 28 });
  });

  it('keeps a sliver on the bar for a tiny amount', () => {
    expect(goalProgress(72, 50_000)).toEqual({ percent: 0, bar: 1 });
  });

  it('has an empty bar when nothing was raised', () => {
    expect(goalProgress(0, 500)).toEqual({ percent: 0, bar: 0 });
  });

  it('reads past 100 when the goal is passed, with a full bar', () => {
    expect(goalProgress(900, 500)).toEqual({ percent: 180, bar: 100 });
  });
});

describe('readableInk', () => {
  it('keeps an accent that already reads on white', () => {
    expect(readableInk('#007a49')).toBe('#007a49');
  });

  it('darkens a pale accent until it reads on white', () => {
    const ink = readableInk('#f5abab');
    expect(ink).not.toBe('#f5abab');
    expect(getContrastRatio(ink, '#ffffff')).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST
    );
  });

  it('returns a valid hex for the palest colour', () => {
    const ink = readableInk('#ffffff');
    expect(ink).toMatch(/^#[0-9a-f]{6}$/);
    expect(getContrastRatio(ink, '#ffffff')).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST
    );
  });
});

describe('reportLink', () => {
  it('tags the link as a printed report', () => {
    expect(
      reportLink(
        'https://www.startplanting.org',
        'solidaritatsfonds-fur-die-nepal'
      )
    ).toBe(
      'https://www.startplanting.org/raise/solidaritatsfonds-fur-die-nepal?utm_source=report&utm_medium=print'
    );
  });

  it('encodes the slug', () => {
    expect(reportLink('https://x.org', 'a b')).toBe(
      'https://x.org/raise/a%20b?utm_source=report&utm_medium=print'
    );
  });
});

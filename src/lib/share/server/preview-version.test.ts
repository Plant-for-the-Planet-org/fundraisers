import type { FundraiserThemeSettings } from '@/lib/theme/types';
import type { Fundraiser, FundraiserHost } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { shareImageVersion } from './preview-version';

vi.mock('server-only', () => ({}));

const ORIGIN = 'https://www.example.org';

const host: FundraiserHost = {
  id: 'h-1',
  user: { id: 'u-1', name: 'Maya Schneider', avatar: null },
  hostType: 'user',
  role: 'owner',
  isPublic: true,
  displayName: null,
  displayOrder: 0,
  status: 'active',
  invitedEmail: null,
};

const theme: FundraiserThemeSettings = {
  accent: 'emerald',
  mode: 'light',
  title_font: 'poppins',
  body_font: 'inter',
  bg: { decoration: 'pattern', pattern_id: 'bg-trees', opacity: 0.3 },
};

const board = {
  enabled: true,
  view_all: true,
  anonymize: false,
  default_tab: 'recent' as const,
  show_amount: true,
  show_top_list: true,
  show_recent_list: true,
  show_avatar: true,
  aggregate_top_by_donor: true,
};

const base: Fundraiser = {
  id: 'f-1',
  hid: 'abc123',
  slug: 'forests',
  title: 'Forests for Our Future',
  description: 'Plant with us.',
  image: 'cover.jpg',
  goalAmount: 5000,
  totalRaised: { EUR: 3600 },
  donationCount: 52,
  currency: 'EUR',
  workspace: null,
  hosts: [host],
  visibility: 'public',
  status: 'active',
  canDonate: true,
  projectAllocations: [],
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  content: null,
  metadata: null,
  settings: {
    theme,
    modules: {
      leaderboard: board,
      donor_score: { enabled: true, show_goal: true, show_days_left: true },
    },
  },
};

const donation = (id: string, donorName: string, avatarUrl?: string) => ({
  id,
  amount: 50,
  currency: 'EUR',
  donorName,
  created: '2026-09-01T10:00:00',
  avatarUrl: avatarUrl ?? null,
  isAnonymous: false,
});

const leaderboard = {
  top: [
    donation('d-1', 'Anna Weber', 'anna.png'),
    donation('d-2', 'Ben Müller'),
  ],
  recent: [donation('d-3', 'Chloé Martin'), donation('d-4', 'David Kim')],
  donorCount: 48,
} as unknown as LeaderboardApiResponse;

const withDonor = (
  index: number,
  changes: Partial<ReturnType<typeof donation>>
): LeaderboardApiResponse => ({
  ...leaderboard,
  top: leaderboard.top.map((entry, i) =>
    i === index ? { ...entry, ...changes } : entry
  ),
});

const version = (
  fundraiser: Fundraiser,
  origin = ORIGIN,
  board: LeaderboardApiResponse | null = leaderboard
) => shareImageVersion(fundraiser, origin, board);

const withTheme = (changes: FundraiserThemeSettings): Fundraiser => ({
  ...base,
  settings: { ...base.settings!, theme: { ...theme, ...changes } },
});

const withBackground = (changes: FundraiserThemeSettings['bg']) =>
  withTheme({ bg: { ...theme.bg, ...changes } });

const withBoard = (changes: Partial<typeof board>): Fundraiser => ({
  ...base,
  settings: {
    ...base.settings!,
    modules: {
      ...base.settings!.modules,
      leaderboard: { ...board, ...changes },
    },
  },
});

const hideGoal = (fundraiser: Fundraiser): Fundraiser => ({
  ...fundraiser,
  settings: {
    ...fundraiser.settings!,
    modules: {
      ...fundraiser.settings!.modules,
      donor_score: { enabled: true, show_goal: false, show_days_left: true },
    },
  },
});

afterEach(() => {
  vi.useRealTimers();
});

describe('shareImageVersion', () => {
  it('is a short hex hash that stays the same for the same fundraiser', () => {
    expect(version(base)).toMatch(/^[0-9a-f]{12}$/);
    expect(version(structuredClone(base))).toBe(version(base));
  });

  it('does not depend on the server, the clock or a restart', () => {
    // Pinned on purpose. If a change to the version's fields moves it, every preview gets a new URL once, which is fine when it is meant.
    expect(version(base)).toBe('ec58337661f5');
  });

  it.each<[string, Fundraiser]>([
    ['the title', { ...base, title: 'Forests for Our Children' }],
    [
      'the host name',
      { ...base, hosts: [{ ...host, displayName: 'Maya S.' }] },
    ],
    ['the cover photo', { ...base, image: 'new-cover.jpg' }],
    ['the currency', { ...base, currency: 'USD' }],
    ['the goal', { ...base, goalAmount: 8000 }],
    ['whether the goal is shown', hideGoal(base)],
    ['the amount raised', { ...base, totalRaised: { EUR: 3500, USD: 250 } }],
    ['the end of the fundraiser', { ...base, status: 'completed' }],
    ['the accent', withTheme({ accent: 'rose' })],
    ['the mode', withTheme({ mode: 'dark' })],
    ['the title font', withTheme({ title_font: 'playfair' })],
    ['the body font', withTheme({ body_font: 'roboto' })],
    ['the pattern', withBackground({ pattern_id: 'bg-dots' })],
    ['the pattern opacity', withBackground({ opacity: 0.6 })],
    ['the decoration', withBackground({ decoration: 'none' })],
    ['the background colour', withBackground({ background_color: '#ffeedd' })],
    [
      'the custom gradient',
      withBackground({
        custom_gradient: {
          angle: 45,
          stops: [
            { color: '#ff0000', position: 0 },
            { color: '#0000ff', position: 100 },
          ],
        },
      }),
    ],
    ['the preset gradient', withBackground({ gradient: 'bg-gray-900' })],
    ['the animation', withBackground({ animation: 'snow' })],
    ['the leaderboard switch', withBoard({ enabled: false })],
    ['the recent list', withBoard({ show_recent_list: false })],
    ['the top list', withBoard({ show_top_list: false })],
    ['anonymised donors', withBoard({ anonymize: true })],
    ['grouping the top list', withBoard({ aggregate_top_by_donor: false })],
    ['the slug in the printed link', { ...base, slug: 'forests-2026' }],
  ])('changes with %s', (_, changed) => {
    expect(version(changed)).not.toBe(version(base));
  });

  it.each<[string, LeaderboardApiResponse | null]>([
    ['a donor who renames', withDonor(0, { donorName: 'Annika Weber' })],
    ['a donor who removes a photo', withDonor(0, { avatarUrl: null })],
    ['a gift made anonymous', withDonor(1, { isAnonymous: true })],
    ['the donor count', { ...leaderboard, donorCount: 49 }],
    ['a leaderboard that could not be loaded', null],
  ])('changes with %s', (_, changed) => {
    expect(version(base, ORIGIN, changed)).not.toBe(version(base));
  });

  it('changes with the origin printed on the image', () => {
    expect(version(base, 'https://preview.example.org')).not.toBe(
      version(base)
    );
  });

  it('changes once an active fundraiser that stopped taking donations passes its end date', () => {
    const closed: Fundraiser = { ...base, canDonate: false };
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T12:00:00Z'));
    const running = version(closed);
    vi.setSystemTime(new Date('2027-01-02T12:00:00Z'));

    expect(version(closed)).not.toBe(running);
  });

  it.each<[string, Fundraiser]>([
    ['the description', { ...base, description: 'Something else.' }],
    ['the visibility', { ...base, visibility: 'unlisted' }],
    ['the dates of a running fundraiser', { ...base, endDate: '2027-06-30' }],
    ['the metadata', { ...base, metadata: { anything: true } }],
    ['a donation that changes nothing drawn', { ...base, donationCount: 53 }],
    [
      'a gift in a currency the image cannot convert',
      { ...base, totalRaised: { ...base.totalRaised, JPY: 9000 } },
    ],
    [
      'a second, private host',
      {
        ...base,
        hosts: [
          host,
          { ...host, id: 'h-2', isPublic: false, displayName: 'Hidden' },
        ],
      },
    ],
    [
      'a leaderboard setting the image ignores',
      withBoard({ show_amount: false }),
    ],
  ])('ignores %s', (_, changed) => {
    expect(version(changed)).toBe(version(base));
  });

  it('ignores the leaderboard when the image shows no donor row', () => {
    const hidden = withBoard({ anonymize: true });

    expect(version(hidden, ORIGIN, withDonor(0, { donorName: 'Annika' }))).toBe(
      version(hidden)
    );
    expect(version(hidden, ORIGIN, null)).toBe(version(hidden));
  });

  it('ignores the amount of a goal the image hides', () => {
    expect(version(hideGoal({ ...base, goalAmount: 9000 }))).toBe(
      version(hideGoal(base))
    );
  });

  it('reads the theme as the page draws it, so a setting it cannot use changes nothing', () => {
    expect(version(withTheme({ body_font: 'comic-sans' }))).toBe(
      version(withTheme({ body_font: undefined }))
    );
  });

  it('changes with the design version', async () => {
    vi.resetModules();
    vi.doMock('../render/design-version', () => ({
      SHARE_IMAGE_DESIGN_VERSION: 999,
    }));
    const bumped = await import('./preview-version');

    expect(bumped.shareImageVersion(base, ORIGIN, leaderboard)).not.toBe(
      version(base)
    );
    vi.doUnmock('../render/design-version');
  });
});

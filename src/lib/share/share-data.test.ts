import type { DonationFrequency } from '@/lib/types/donation';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardDonation } from '@/lib/types/leaderboard';
import type { ShareGift } from './share-data';

import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import de from '../../../locales/de/share.json';
import en from '../../../locales/en/share.json';
import {
  buildShareRenderData,
  getShareDonorProgress,
  getShareProjectNames,
  isDonorRefreshMoment,
  pickShareDonors,
  previewDonorProgress,
  previewLeaderboard,
  shareStoryExcerpt,
} from './share-data';

const donation = (
  donorName: string,
  isAnonymous = false
): LeaderboardDonation => ({
  id: donorName,
  amount: 10,
  currency: 'EUR',
  donorName,
  created: '2026-09-01T10:00:00',
  isAnonymous,
});

function fundraiser(
  leaderboard: Record<string, unknown> | undefined,
  overrides: Partial<Fundraiser> = {}
) {
  return {
    title: 'Forests for Our Future',
    goalAmount: 5000,
    totalRaised: { EUR: 3400 },
    currency: 'EUR',
    hosts: [
      {
        user: { id: 'u1', name: 'Maya Schneider', avatar: null },
        displayName: null,
        isPublic: true,
        role: 'owner',
        status: 'active',
        displayOrder: 0,
      },
    ],
    settings: { modules: { leaderboard } },
    ...overrides,
  } as unknown as Fundraiser;
}

const shownBoard = {
  enabled: true,
  show_recent_list: true,
  show_top_list: false,
  anonymize: false,
};

describe('pickShareDonors', () => {
  const board = {
    top: [] as LeaderboardDonation[],
    recent: [
      donation('Anna Weber'),
      donation('Hidden', true),
      donation('Ben'),
      donation('Anna K'),
      donation('Chloé Martin'),
    ],
    donorCount: 48,
  };

  it('names public donors by first name, once each', () => {
    expect(pickShareDonors(fundraiser(shownBoard), board)).toMatchObject({
      names: ['Anna', 'Ben', 'Chloé'],
      count: 48,
      // The donation id seeds the generated avatar, as in the donor list.
      people: [
        { seed: 'Anna Weber', avatarFile: null },
        { seed: 'Ben', avatarFile: null },
        { seed: 'Chloé Martin', avatarFile: null },
      ],
    });
  });

  it('takes top donors first, so a few frequent givers do not fill the row alone', () => {
    const frequent = {
      top: [
        donation('Heidi Klum'),
        donation('Anonymous', true),
        donation('Leni Klum'),
        donation('Maja Neske'),
      ],
      recent: [
        donation('Sagar Aryal'),
        donation('Sagar Aryal'),
        donation('Maria Hosfeld'),
      ],
      donorCount: 246,
    };
    expect(pickShareDonors(fundraiser(shownBoard), frequent)).toMatchObject({
      names: ['Heidi', 'Leni', 'Maja', 'Sagar', 'Maria'],
      count: 246,
    });
  });

  it('names nobody when the leaderboard is off or anonymised', () => {
    expect(
      pickShareDonors(fundraiser({ ...shownBoard, enabled: false }), board)
    ).toBeNull();
    expect(
      pickShareDonors(fundraiser({ ...shownBoard, anonymize: true }), board)
    ).toBeNull();
    expect(pickShareDonors(fundraiser(undefined), board)).toBeNull();
  });

  it('leaves the row out with too few public donors', () => {
    expect(
      pickShareDonors(fundraiser(shownBoard), {
        top: [],
        recent: [donation('Anna'), donation('Ben')],
        donorCount: 2,
      })
    ).toBeNull();
  });
});

describe('getShareDonorProgress', () => {
  const people = (count: number, anonymous = 0) => [
    ...Array.from({ length: count }, (_, i) => donation(`Donor${i}`)),
    ...Array.from({ length: anonymous }, (_, i) =>
      donation(`Hidden${i}`, true)
    ),
  ];
  const board = (donations: LeaderboardDonation[], donorCount?: number) => ({
    top: [],
    recent: donations,
    donorCount: donorCount ?? donations.length,
  });

  it('says donors are off when the page hides them, whatever the count', () => {
    const hidden = fundraiser({ ...shownBoard, enabled: false });
    expect(getShareDonorProgress(hidden, board(people(5)))).toEqual({
      status: 'off',
      count: 0,
      total: 5,
    });
    const anonymised = fundraiser({ ...shownBoard, anonymize: true });
    expect(getShareDonorProgress(anonymised, board(people(5))).status).toBe(
      'off'
    );
  });

  it('counts public donors so far, and leaves anonymous ones out', () => {
    expect(
      getShareDonorProgress(fundraiser(shownBoard), board(people(2, 3)))
    ).toEqual({ status: 'few', count: 2, total: 5 });
    expect(
      getShareDonorProgress(fundraiser(shownBoard), board(people(0)))
    ).toEqual({ status: 'few', count: 0, total: 0 });
  });

  it('is ready from three public donors, in step with pickShareDonors', () => {
    const three = board(people(3));
    expect(getShareDonorProgress(fundraiser(shownBoard), three).status).toBe(
      'ready'
    );
    expect(pickShareDonors(fundraiser(shownBoard), three)).not.toBeNull();
    const two = board(people(2, 4));
    expect(getShareDonorProgress(fundraiser(shownBoard), two).status).toBe(
      'few'
    );
    expect(pickShareDonors(fundraiser(shownBoard), two)).toBeNull();
  });

  it('has no donors while the leaderboard cannot be loaded', () => {
    expect(getShareDonorProgress(fundraiser(shownBoard), null)).toEqual({
      status: 'few',
      count: 0,
      total: 0,
    });
  });
});

describe('isDonorRefreshMoment', () => {
  const progress = (status: 'off' | 'few' | 'ready', total: number) => ({
    status,
    count: 3,
    total,
  });

  it('is true only when donors can be named and the fundraiser is still early', () => {
    expect(isDonorRefreshMoment(progress('ready', 3))).toBe(true);
    expect(isDonorRefreshMoment(progress('ready', 9))).toBe(true);
    expect(isDonorRefreshMoment(progress('ready', 10))).toBe(false);
  });

  it('is false while donors are off or too few, and before anything has loaded', () => {
    expect(isDonorRefreshMoment(progress('few', 2))).toBe(false);
    expect(isDonorRefreshMoment(progress('off', 4))).toBe(false);
    expect(isDonorRefreshMoment(null)).toBe(false);
    expect(isDonorRefreshMoment(undefined)).toBe(false);
  });
});

describe('previewDonorProgress', () => {
  it('forces a donor state from the address on a development server', () => {
    expect(previewDonorProgress('?donorState=ready')?.status).toBe('ready');
    expect(previewDonorProgress('?donorState=few')?.status).toBe('few');
    expect(previewDonorProgress('?donorState=off')?.status).toBe('off');
    expect(previewDonorProgress('?donorState=other')).toBeNull();
    expect(previewDonorProgress('')).toBeNull();
  });

  it('does nothing in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(previewDonorProgress('?donorState=ready')).toBeNull();
    vi.unstubAllEnvs();
  });
});

describe('previewLeaderboard', () => {
  it('stands in made-up donors from the address on a development server', () => {
    const board = previewLeaderboard('?donors=4')!;
    expect(board.donorCount).toBe(4);
    expect(board.recent.map(d => d.donorName.split(' ')[0])).toEqual([
      'Anna',
      'Ben',
      'Chloé',
      'David',
    ]);
    expect(board.recent.every(d => !d.isAnonymous)).toBe(true);
    // The donors count the same way as real ones.
    expect(pickShareDonors(fundraiser(shownBoard), board)?.names).toEqual([
      'Anna',
      'Ben',
      'Chloé',
      'David',
    ]);
    expect(
      getShareDonorProgress(
        fundraiser(shownBoard),
        previewLeaderboard('?donors=2')
      ).status
    ).toBe('few');
  });

  it('ignores anything else, and does nothing in production', () => {
    expect(previewLeaderboard('')).toBeNull();
    expect(previewLeaderboard('?donors=lots')).toBeNull();
    expect(previewLeaderboard('?donors=500')).toBeNull();
    vi.stubEnv('NODE_ENV', 'production');
    expect(previewLeaderboard('?donors=4')).toBeNull();
    vi.unstubAllEnvs();
  });
});

describe('buildShareRenderData', () => {
  const labels = {
    byLine: (host: string) => `by ${host}`,
    raisedOf: (raised: string, goal: string) => `${raised} raised of ${goal}`,
    raised: (raised: string) => `${raised} raised`,
    goal: (goal: string) => `Goal: ${goal}`,
    started: () => 'Just getting started',
    first: () => 'Be the first to give',
    newBadge: () => 'New',
    given: (first: string, second: string, others: number) =>
      `${first}, ${second} and ${others} others have given`,
  };

  it('fills the text from the fundraiser', () => {
    const data = buildShareRenderData({
      fundraiser: fundraiser(shownBoard),
      locale: 'en',
      donors: {
        names: ['Anna', 'Ben', 'Chloé'],
        people: [],
        count: 48,
      },
      cta: 'Join me',
      url: 'startplanting.org/raise/forests',
      labels,
    });
    expect(data.byLine).toBe('by Maya Schneider');
    expect(data.raised).toBe(3400);
    expect(data.goal).toBe(5000);
    expect(data.donorsLine).toBe('Anna, Ben and 46 others have given');
    expect(
      data.raisedLine!(data.formatMoney(3400), data.formatMoney(5000))
    ).toContain('raised of');
  });

  const labelsBase = () => ({
    locale: 'en',
    donors: null,
    cta: 'Join me',
    url: 'startplanting.org/raise/forests',
    labels,
  });

  describe('the supported projects', () => {
    const allocation = (name: string, percentage: number) => ({
      percentage,
      project: {
        id: name,
        name,
        description: '',
        image: '',
        allowDonations: true,
      },
    });
    const withProjects = {
      ...labelsBase(),
      fundraiser: fundraiser(shownBoard, {
        projectAllocations: [
          allocation('Small', 10),
          allocation('Big', 60),
          allocation('Tiny', 5),
          allocation('Medium', 25),
        ],
      }),
    };

    it('lists the projects with the biggest share first', () => {
      expect(getShareProjectNames(withProjects.fundraiser)).toEqual([
        'Big',
        'Medium',
        'Small',
        'Tiny',
      ]);
    });

    it('puts the count and the names on the image, only when asked', () => {
      const labelsWith = {
        ...labels,
        supporting: (n: number) => `Supporting ${n}`,
      };
      expect(
        buildShareRenderData({
          ...withProjects,
          labels: labelsWith,
          showProjects: true,
        }).impact
      ).toEqual({
        label: 'Supporting 4',
        names: ['Big', 'Medium', 'Small', 'Tiny'],
        more: 0,
      });
      expect(
        buildShareRenderData({ ...withProjects, labels: labelsWith }).impact
      ).toBeNull();
    });

    it('names at most five and counts the rest, for a big bouquet', () => {
      const many = fundraiser(shownBoard, {
        projectAllocations: Array.from({ length: 8 }, (_, i) =>
          allocation(`P${i}`, 10 + i)
        ),
      });
      const impact = buildShareRenderData({
        ...withProjects,
        fundraiser: many,
        labels: { ...labels, supporting: (n: number) => `Supporting ${n}` },
        showProjects: true,
      }).impact!;
      expect(impact.names).toHaveLength(5);
      expect(impact.more).toBe(3);
      expect(impact.label).toBe('Supporting 8');
    });

    it('has none for a fundraiser with no projects', () => {
      expect(
        buildShareRenderData({
          ...withProjects,
          labels: { ...labels, supporting: (n: number) => `Supporting ${n}` },
          fundraiser: fundraiser(shownBoard, { projectAllocations: [] }),
          showProjects: true,
        }).impact
      ).toBeNull();
    });
  });

  describe('the Story card text', () => {
    it('turns rich text into plain text', () => {
      expect(
        shareStoryExcerpt('<p>Plant &amp; grow</p><p>with&nbsp;me</p>')
      ).toBe('Plant & grow with me');
      expect(shareStoryExcerpt('<p> </p>')).toBeNull();
      expect(shareStoryExcerpt(null)).toBeNull();
    });

    it('cuts a long story at a word and ends it with an ellipsis', () => {
      const long = 'tree '.repeat(100);
      const excerpt = shareStoryExcerpt(long, 50)!;
      expect(excerpt.length).toBeLessThanOrEqual(51);
      expect(excerpt.endsWith('tree…')).toBe(true);
    });

    it('ignores a description that only repeats the title', () => {
      const repeat = {
        ...labelsBase(),
        fundraiser: fundraiser(shownBoard, {
          title: 'Test fundraiser',
          description: '<p>test fundraiser</p>',
        }),
      };
      expect(
        buildShareRenderData({ ...repeat, card: 'story' }).note
      ).toBeNull();
    });

    it('uses the story only on the Story card, and the host line first', () => {
      const withStory = {
        ...labelsBase(),
        fundraiser: fundraiser(shownBoard, {
          description: '<p>Why this matters.</p>',
        }),
      };
      expect(buildShareRenderData({ ...withStory, card: 'story' }).note).toBe(
        'Why this matters.'
      );
      expect(
        buildShareRenderData({ ...withStory, card: 'minimal' }).note
      ).toBeNull();
      expect(
        buildShareRenderData({ ...withStory, card: 'story', note: 'Mine' }).note
      ).toBe('Mine');
    });
  });

  describe('what the host chooses to show', () => {
    const build = (extra: Parameters<typeof buildShareRenderData>[0]) =>
      buildShareRenderData({ ...extra });
    const base = {
      fundraiser: fundraiser(shownBoard),
      locale: 'en',
      donors: null,
      cta: 'Join me',
      url: 'startplanting.org/raise/forests',
      labels,
    };

    it("carries the host's own line, trimmed, and drops an empty one", () => {
      expect(build({ ...base, note: '  For my daughter  ' }).note).toBe(
        'For my daughter'
      );
      expect(build({ ...base, note: '   ' }).note).toBeNull();
      expect(build(base).note).toBeNull();
    });

    it('leaves out the amounts, the goal and the first-gift invite when amounts are off', () => {
      const fresh = build({
        ...base,
        fundraiser: fundraiser(shownBoard, { totalRaised: {} }),
        showAmounts: false,
      });
      expect(fresh.raisedLine).toBeNull();
      expect(fresh.goal).toBeNull();
      expect(fresh.firstLine).toBeNull();
      expect(fresh.badge).toBeNull();
    });

    it('leaves out the host name when asked', () => {
      expect(build({ ...base, showHost: false }).byLine).toBe('');
      expect(build(base).byLine).toBe('by Maya Schneider');
    });
  });

  it('hides the goal when the host hides it', () => {
    const data = buildShareRenderData({
      fundraiser: fundraiser(shownBoard, {
        settings: {
          modules: {
            donor_score: {
              enabled: true,
              show_goal: false,
              show_days_left: true,
            },
          },
        },
      } as Partial<Fundraiser>),
      locale: 'en',
      donors: null,
      cta: 'Join me',
      url: 'x',
      labels,
    });
    expect(data.goal).toBeNull();
    expect(data.donorsLine).toBeNull();
    expect(data.raisedLine!('€3,400', null)).toBe('€3,400 raised');
  });

  it('shows no money when the host hides the goal section', () => {
    const data = buildShareRenderData({
      fundraiser: fundraiser(shownBoard, {
        // The public API sends an empty total for a hidden goal section, which must not read as "nothing raised".
        totalRaised: {},
        settings: {
          modules: {
            donor_score: {
              enabled: false,
              show_goal: true,
              show_days_left: true,
            },
          },
        },
      } as Partial<Fundraiser>),
      locale: 'en',
      donors: null,
      cta: 'Join me',
      url: 'x',
      labels,
    });
    expect(data.raisedLine).toBeNull();
    expect(data.goal).toBeNull();
    expect(data.badge).toBeNull();
    expect(data.firstLine).toBeNull();
  });

  it('never names a private host, even when no host is public', () => {
    const host = fundraiser(shownBoard).hosts[0];
    const build = (hosts: Fundraiser['hosts']) =>
      buildShareRenderData({
        fundraiser: fundraiser(shownBoard, { hosts }),
        locale: 'en',
        donors: null,
        cta: 'Join me',
        url: 'x',
        labels,
      }).byLine;

    // The dashboard's copy of a fundraiser lists private hosts too.
    expect(build([{ ...host, isPublic: false }])).toBe('');
    expect(
      build([
        { ...host, isPublic: false },
        { ...host, displayName: 'Tom', status: 'invited' },
        { ...host, displayName: 'Lea' },
      ])
    ).toBe('by Lea');
  });

  describe('the gift line', () => {
    const messages = { en, de };
    const build = (gift: ShareGift | null, locale: 'en' | 'de' = 'en') => {
      const t = createTranslator({
        locale,
        messages: messages[locale],
        namespace: 'Share',
      });
      return buildShareRenderData({
        fundraiser: fundraiser(shownBoard),
        locale,
        donors: null,
        cta: 'Join me',
        url: 'x',
        labels: {
          ...labels,
          // As the studio wires it.
          gift: (amount, frequency) => t(`image.gift.${frequency}`, { amount }),
        },
        gift,
      });
    };

    it.each<[DonationFrequency, number, string, string]>([
      ['once', 50, 'I just gave €50!', 'Ich habe gerade 50\u00a0€ gespendet!'],
      [
        'monthly',
        20,
        'I give €20 every month!',
        'Ich spende jeden Monat 20\u00a0€!',
      ],
      [
        'yearly',
        50,
        'I give €50 every year!',
        'Ich spende jedes Jahr 50\u00a0€!',
      ],
    ])('says what a %s gift is', (frequency, amount, english, german) => {
      const gift = { amount, currency: 'EUR', frequency };
      expect(build(gift).giftLine).toBe(english);
      expect(build(gift, 'de').giftLine).toBe(german);
    });

    it("uses the donor's own currency and reads the amount as a decimal", () => {
      // The fundraiser raises in euros.
      expect(
        build({ amount: 12.5, currency: 'USD', frequency: 'once' }).giftLine
      ).toBe('I just gave $12.50!');
      expect(
        build({ amount: 1250, currency: 'EUR', frequency: 'monthly' }, 'de')
          .giftLine
      ).toBe('Ich spende jeden Monat 1.250\u00a0€!');
    });

    it('leaves the line out without a gift', () => {
      expect(build(null).giftLine).toBeNull();
    });

    it('leaves the line out without a gift label, as in the link preview', () => {
      const data = buildShareRenderData({
        fundraiser: fundraiser(shownBoard),
        locale: 'en',
        donors: null,
        cta: 'Join me',
        url: 'x',
        labels,
        gift: { amount: 50, currency: 'EUR', frequency: 'once' },
      });
      expect(data.giftLine).toBeNull();
    });

    it("counts the donor's gift, so the first donor is not invited to give first", () => {
      // Active and open, or hasFundraiserConcluded would hide the invite for the wrong reason.
      const fresh = fundraiser(shownBoard, {
        status: 'active',
        canDonate: true,
        totalRaised: {},
      } as Partial<Fundraiser>);
      const build = (gift: ShareGift | null) =>
        buildShareRenderData({
          fundraiser: fresh,
          locale: 'en',
          donors: null,
          cta: 'Join me',
          url: 'x',
          labels: { ...labels, gift: amount => `I just gave ${amount}!` },
          gift,
        });

      const before = build(null);
      expect(before.badge).toBe('New');
      expect(before.firstLine).toBe('Be the first to give');

      const after = build({ amount: 50, currency: 'EUR', frequency: 'once' });
      expect(after.badge).toBeNull();
      expect(after.firstLine).toBeNull();
      expect(after.raised).toBe(50);
      expect(
        after.raisedLine!(
          after.formatMoney(after.raised),
          after.formatMoney(5000)
        )
      ).toBe('€50 raised of €5,000');
      // Another currency is converted, like the rest of the total.
      expect(
        build({ amount: 50, currency: 'USD', frequency: 'once' }).raised
      ).toBe(40);
    });

    it('still counts the gift when the donor leaves its line off', () => {
      const fresh = fundraiser(shownBoard, {
        status: 'active',
        canDonate: true,
        totalRaised: { EUR: 100 },
      } as Partial<Fundraiser>);
      const data = buildShareRenderData({
        fundraiser: fresh,
        locale: 'en',
        donors: null,
        cta: 'Join me',
        url: 'x',
        labels: { ...labels, gift: amount => `I just gave ${amount}!` },
        gift: { amount: 50, currency: 'EUR', frequency: 'once' },
        showGift: false,
      });
      expect(data.giftLine).toBeNull();
      expect(data.raised).toBe(150);

      const first = buildShareRenderData({
        fundraiser: fundraiser(shownBoard, {
          status: 'active',
          canDonate: true,
          totalRaised: {},
        } as Partial<Fundraiser>),
        locale: 'en',
        donors: null,
        cta: 'Join me',
        url: 'x',
        labels,
        gift: { amount: 50, currency: 'EUR', frequency: 'once' },
        showGift: false,
      });
      expect(first.firstLine).toBeNull();
      expect(first.badge).toBeNull();
    });
  });
});

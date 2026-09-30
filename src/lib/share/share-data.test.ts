import type { DonationFrequency } from '@/lib/types/donation';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardDonation } from '@/lib/types/leaderboard';
import type { ShareGift } from './share-data';

import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import de from '../../../locales/de/share.json';
import en from '../../../locales/en/share.json';
import { buildShareRenderData, pickShareDonors } from './share-data';

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
      data.raisedLine(data.formatMoney(3400), data.formatMoney(5000))
    ).toContain('raised of');
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
    expect(data.raisedLine('€3,400', null)).toBe('€3,400 raised');
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
      ['once', 50, 'I just gave €50!', 'Ich habe gerade €50 gespendet!'],
      ['monthly', 20, 'I give €20 every month!', 'Ich spende jeden Monat €20!'],
      ['yearly', 50, 'I give €50 every year!', 'Ich spende jedes Jahr €50!'],
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
      ).toBe('Ich spende jeden Monat €1.250!');
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
        after.raisedLine(
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

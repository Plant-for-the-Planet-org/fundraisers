import type { Fundraiser, FundraiserHost } from '@/lib/types/fundraiser';

import { describe, expect, it } from 'vitest';
import {
  getFundraiserChecklist,
  getFundraiserModuleStates,
  KEEP_SHARING_MIN_DONORS,
  STORY_MIN_LENGTH,
  STORY_MIN_LENGTH_WITH_MEDIA,
} from './fundraiser-checklist';

function makeHost(status: FundraiserHost['status']): FundraiserHost {
  return {
    id: `host_${status}_${Math.random()}`,
    user: null,
    hostType: 'user',
    role: 'owner',
    isPublic: true,
    displayName: null,
    displayOrder: null,
    status,
    invitedEmail: null,
  } as FundraiserHost;
}

function makeFundraiser(overrides: Partial<Fundraiser> = {}): Fundraiser {
  return {
    id: 'fr_1',
    hid: 'HID',
    slug: 'trees',
    title: 'Trees',
    description: null,
    image: null,
    goalAmount: 0,
    totalRaised: {},
    donationCount: 0,
    currency: 'EUR',
    workspace: null,
    hosts: [makeHost('active')],
    visibility: 'public',
    status: 'draft',
    canDonate: false,
    projectAllocations: [],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    content: null,
    metadata: null,
    settings: null,
    ...overrides,
  } as Fundraiser;
}

function doneIds(fundraiser: Fundraiser): string[] {
  return getFundraiserChecklist(fundraiser)
    .filter(item => item.done)
    .map(item => item.id);
}

describe('getFundraiserChecklist', () => {
  it('keeps sharing open while people can give, and ticks it once the fundraiser ends', () => {
    const live = makeFundraiser({ status: 'active', canDonate: true });
    expect(doneIds(live)).not.toContain('keepSharing');
    const ended = makeFundraiser({ status: 'completed', canDonate: false });
    expect(doneIds(ended)).toContain('keepSharing');
  });

  it('puts the first share before the first donation, and keep sharing last', () => {
    const ids = getFundraiserChecklist(makeFundraiser()).map(item => item.id);
    expect(ids).toEqual([
      'coverImage',
      'story',
      'goal',
      'published',
      'coHost',
      'share',
      'firstDonation',
      'keepSharing',
    ]);
  });

  it('counts the first share as done once a gift has arrived', () => {
    expect(doneIds(makeFundraiser({ donationCount: 0 }))).not.toContain(
      'share'
    );
    expect(doneIds(makeFundraiser({ donationCount: 1 }))).toContain('share');
  });

  describe('keep sharing', () => {
    const lockedFor = (
      donorCount: number | null,
      overrides: Partial<Fundraiser> = {}
    ) =>
      getFundraiserChecklist(
        makeFundraiser({ status: 'active', canDonate: true, ...overrides }),
        donorCount
      ).find(item => item.id === 'keepSharing')!.locked;

    it('is locked until three people have given', () => {
      expect(lockedFor(0)).toBe(true);
      expect(lockedFor(2)).toBe(true);
      expect(lockedFor(KEEP_SHARING_MIN_DONORS)).toBe(false);
      expect(lockedFor(12)).toBe(false);
    });

    it('is locked while the donor count is not known yet', () => {
      expect(lockedFor(null)).toBe(true);
    });

    it('is never locked once the fundraiser has ended', () => {
      expect(lockedFor(0, { status: 'completed', canDonate: false })).toBe(
        false
      );
    });
  });

  it('marks nothing done on a blank draft', () => {
    expect(doneIds(makeFundraiser())).toEqual([]);
  });

  it('marks every step but keep sharing done on a complete, live fundraiser', () => {
    const fundraiser = makeFundraiser({
      image: 'cover.jpg',
      description: `<p>${'a'.repeat(STORY_MIN_LENGTH)}</p>`,
      goalAmount: 5000,
      status: 'active',
      hosts: [makeHost('active'), makeHost('active')],
      donationCount: 3,
    });
    expect(doneIds(fundraiser)).toHaveLength(7);
    expect(doneIds(fundraiser)).not.toContain('keepSharing');
  });

  it('counts the story by its text, not its markup', () => {
    const markupHeavy = `<p><strong>${'a'.repeat(STORY_MIN_LENGTH - 1)}</strong></p>`;
    expect(doneIds(makeFundraiser({ description: markupHeavy }))).not.toContain(
      'story'
    );
  });

  it('accepts a shorter story when it has a picture or video', () => {
    const words = 'a'.repeat(STORY_MIN_LENGTH_WITH_MEDIA);
    const withImage = `<p>${words}</p><image-embed data-image-src="x.jpg"></image-embed>`;
    const withVideo = `<p>${words}</p><video-embed data-video-provider="youtube" data-video-id="abc"></video-embed>`;
    expect(doneIds(makeFundraiser({ description: withImage }))).toContain(
      'story'
    );
    expect(doneIds(makeFundraiser({ description: withVideo }))).toContain(
      'story'
    );
  });

  it('still wants a few words next to a picture', () => {
    const imageOnly = `<p>Hi</p><image-embed data-image-src="x.jpg"></image-embed>`;
    expect(doneIds(makeFundraiser({ description: imageOnly }))).not.toContain(
      'story'
    );
  });

  it('does not count an invited co-host until they accept', () => {
    const fundraiser = makeFundraiser({
      hosts: [makeHost('active'), makeHost('invited')],
    });
    expect(doneIds(fundraiser)).not.toContain('coHost');
  });
});

describe('getFundraiserModuleStates', () => {
  it('treats a thank-you note without a message as off', () => {
    const fundraiser = makeFundraiser({
      settings: {
        theme: {},
        modules: { thankYouNote: { enabled: true, message: '  ' } },
      } as unknown as Fundraiser['settings'],
    });
    const note = getFundraiserModuleStates(fundraiser).find(
      m => m.id === 'thankYouNote'
    );
    expect(note?.enabled).toBe(false);
  });

  it('reports every module as off when there are no settings', () => {
    expect(
      getFundraiserModuleStates(makeFundraiser()).every(m => !m.enabled)
    ).toBe(true);
  });
});

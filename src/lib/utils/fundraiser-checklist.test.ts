import type { Fundraiser, FundraiserHost } from '@/lib/types/fundraiser';

import { describe, expect, it } from 'vitest';
import {
  getFundraiserChecklist,
  getFundraiserModuleStates,
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
    expect(doneIds(live)).not.toContain('share');
    const ended = makeFundraiser({ status: 'completed', canDonate: false });
    expect(doneIds(ended)).toContain('share');
  });

  it('puts sharing last', () => {
    expect(getFundraiserChecklist(makeFundraiser()).at(-1)?.id).toBe('share');
  });

  it('marks nothing done on a blank draft', () => {
    expect(doneIds(makeFundraiser())).toEqual([]);
  });

  it('marks every step but sharing done on a complete, live fundraiser', () => {
    const fundraiser = makeFundraiser({
      image: 'cover.jpg',
      description: `<p>${'a'.repeat(STORY_MIN_LENGTH)}</p>`,
      goalAmount: 5000,
      status: 'active',
      hosts: [makeHost('active'), makeHost('active')],
      donationCount: 3,
    });
    expect(doneIds(fundraiser)).toHaveLength(6);
    expect(doneIds(fundraiser)).not.toContain('share');
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

import type { Fundraiser } from '@/lib/types/fundraiser';

import { describe, expect, it, vi } from 'vitest';

// The real registry pulls in the stage module's React components, which a node
// test environment has no use for. Two fake modules cover both clone policies.
vi.mock('@/modules', () => ({
  registeredModules: [
    { id: 'stage', settingsKey: 'stage', clone: 'copy' },
    { id: 'ghost', settingsKey: 'ghost', clone: 'reset' },
  ],
}));

const { buildCloneFundraiserRequest } =
  await import('./fundraiser-data-builder');

function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]!;
}

function makeFundraiser(overrides: Partial<Fundraiser> = {}): Fundraiser {
  return {
    id: 'fr_source',
    hid: 'SOURCEHID',
    slug: 'source-slug',
    title: 'Trees for Munich',
    description: '<p>Help us plant.</p>',
    image: 'cover.jpg',
    goalAmount: 5000,
    totalRaised: { EUR: 2052.85 },
    donationCount: 12,
    currency: 'eur',
    workspace: {
      country: 'DE',
      name: 'Plant-for-the-Planet Deutschland',
      address: {
        address: 'Street 1',
        city: 'Uffing',
        zipCode: '82449',
        country: 'DE',
      },
    },
    hosts: [],
    visibility: 'unlisted',
    status: 'active',
    canDonate: true,
    projectAllocations: [
      {
        project: {
          id: 'proj_a',
          name: 'Yucatan',
          description: '',
          image: '',
          allowDonations: true,
        },
        percentage: 60,
      },
      {
        project: {
          id: 'proj_b',
          name: 'Ghana',
          description: '',
          image: '',
          allowDonations: true,
        },
        percentage: 40,
      },
    ],
    startDate: '2026-03-03T00:00:00+00:00',
    endDate: daysFromToday(30),
    content: { note: 'kept' },
    metadata: { closedMessage: 'kept too' },
    settings: {
      theme: { base_id: 'spring', accent: 'emerald' },
      modules: {
        thankYouNote: { enabled: true, message: 'Danke!' },
        stage: {
          enabled: true,
          locale: 'de',
          title: 'Stage',
          description: '',
          partner_logo_url: '',
          slides: [],
        },
        ghost: { enabled: true },
      } as never,
    },
    ...overrides,
  };
}

describe('buildCloneFundraiserRequest', () => {
  it('carries over what the host configured', () => {
    const request = buildCloneFundraiserRequest(
      makeFundraiser(),
      'Bäume für München'
    );

    expect(request.title).toBe('Bäume für München');
    expect(request.description).toBe('<p>Help us plant.</p>');
    expect(request.goalAmount).toBe(5000);
    expect(request.visibility).toBe('unlisted');
    expect(request.currency).toBe('EUR');
    expect(request.country).toBe('DE');
    expect(request.settings.theme).toEqual({
      base_id: 'spring',
      accent: 'emerald',
    });
    expect(request.settings.modules.thankYouNote).toEqual({
      enabled: true,
      message: 'Danke!',
    });
    expect(request.content).toEqual({ note: 'kept' });
    expect(request.metadata).toEqual({ closedMessage: 'kept too' });
  });

  it('always starts as a draft, whatever the source status is', () => {
    const request = buildCloneFundraiserRequest(
      makeFundraiser({ status: 'active' }),
      'Copy'
    );

    expect(request.status).toBe('draft');
  });

  it('flattens project allocations into the create shape', () => {
    const request = buildCloneFundraiserRequest(makeFundraiser(), 'Copy');

    expect(request.projectAllocations).toEqual([
      { project_id: 'proj_a', percentage: 60 },
      { project_id: 'proj_b', percentage: 40 },
    ]);
  });

  it('keeps a date window that is still running', () => {
    const endDate = daysFromToday(30);
    const request = buildCloneFundraiserRequest(
      makeFundraiser({ startDate: '2026-03-03T00:00:00+00:00', endDate }),
      'Copy'
    );

    expect(request.startDate).toBe('2026-03-03');
    expect(request.endDate).toBe(endDate);
  });

  it('starts a fresh window when the source has already ended', () => {
    const request = buildCloneFundraiserRequest(
      makeFundraiser({
        startDate: '2020-01-01T00:00:00+00:00',
        endDate: '2020-03-01T00:00:00+00:00',
      }),
      'Copy'
    );

    expect(request.startDate).toBe(daysFromToday(0));
    expect(request.endDate).toBe(daysFromToday(60));
  });

  it('drops the settings of modules that opted out of cloning', () => {
    const request = buildCloneFundraiserRequest(makeFundraiser(), 'Copy');
    const modules = request.settings.modules as Record<string, unknown>;

    expect(modules.stage).toBeDefined();
    expect(modules).not.toHaveProperty('ghost');
  });

  it('sends the image only when one was re-uploaded', () => {
    expect(
      buildCloneFundraiserRequest(makeFundraiser(), 'Copy').imageFile
    ).toBeUndefined();
    expect(
      buildCloneFundraiserRequest(
        makeFundraiser(),
        'Copy',
        'data:image/jpeg;base64,abc'
      ).imageFile
    ).toBe('data:image/jpeg;base64,abc');
  });
});

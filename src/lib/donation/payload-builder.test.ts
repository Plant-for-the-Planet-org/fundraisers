import type { DonationFormData, DonationMetadata } from '../types/donation';
import type { Fundraiser } from '../types/fundraiser';

import { describe, expect, it } from 'vitest';
import { buildDonationMetadata } from './payload-builder';

const fundraiser = {
  id: 'fr_gDESU5H2R1YK',
  hid: '26NZ151G29',
  slug: 'klumforest',
} as Fundraiser;

const formData = {
  type: 'guest',
  amountCents: 1000,
  currency: 'EUR',
  frequency: 'once',
  isAnonymous: false,
} as DonationFormData;

describe('buildDonationMetadata', () => {
  it('carries the campaign alongside the fundraiser id', () => {
    const metadata = buildDonationMetadata(
      formData,
      fundraiser,
      undefined,
      undefined,
      'example.org',
      undefined,
      undefined,
      {
        utm_source: 'instagram',
        utm_medium: 'social',
        utm_campaign: 'christmas',
      }
    );

    expect(metadata).toMatchObject({
      utm_source: 'instagram',
      utm_medium: 'social',
      utm_campaign: 'christmas',
      fundraiser: { id: fundraiser.id },
    });
  });

  it('sends no utm_campaign when the donor arrived without one', () => {
    const metadata = buildDonationMetadata(
      formData,
      fundraiser,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    expect(metadata).not.toHaveProperty('utm_campaign');
    expect(metadata.fundraiser.id).toBe(fundraiser.id);
  });

  // `DonationMetadata extends DonationUtm`, so a wider object is assignable to the
  // `utm` parameter without tripping an excess property check. The platform matches
  // on `fundraiser.id` to attach the donation, so it must survive the spread.
  it('never lets a wider object displace fundraiser.id', () => {
    const hostile: DonationMetadata = {
      fundraiser: { id: 'fr_someOtherOne', privacy: { is_anonymous: false } },
    };

    const metadata = buildDonationMetadata(
      formData,
      fundraiser,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      hostile
    );

    expect(metadata.fundraiser.id).toBe(fundraiser.id);
  });
});

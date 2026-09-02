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
      { utm_source: 'stage', utm_medium: 'qr' }
    );

    expect(metadata).toMatchObject({
      utm_campaign: fundraiser.id,
      utm_source: 'stage',
      utm_medium: 'qr',
    });
  });

  // `DonationMetadata extends DonationUtm`, so a wider object is assignable to the
  // `utm` parameter without tripping an excess property check. The platform matches
  // on `utm_campaign` to attach the donation, so it must survive the spread.
  it('never lets a wider object displace utm_campaign', () => {
    const hostile: DonationMetadata = {
      utm_campaign: 'fr_someOtherOne',
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

    expect(metadata.utm_campaign).toBe(fundraiser.id);
    expect(metadata.fundraiser.id).toBe(fundraiser.id);
  });
});

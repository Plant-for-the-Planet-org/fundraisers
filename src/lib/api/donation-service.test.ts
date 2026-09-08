import type { PrepaidDonationPayload } from '../types/donation';
import type * as PlatformFetchModule from './platform-fetch';

import { describe, expect, it, vi } from 'vitest';

vi.mock('./platform-fetch', async importOriginal => {
  const actual = await importOriginal<typeof PlatformFetchModule>();
  return { ...actual, platformFetch: vi.fn() };
});

import type { DonationError } from './donation-service';

import { donationService } from './donation-service';
import { PlatformAPIError, platformFetch } from './platform-fetch';

const mockedPlatformFetch = platformFetch as ReturnType<typeof vi.fn>;

const payload: PrepaidDonationPayload = {
  amount: 10,
  currency: 'EUR',
  frequency: 'once',
  lineItems: [{ project: 'proj_1', amount: 10 }],
  metadata: {
    utm_campaign: 'fundraiser_1',
    fundraiser: {
      id: 'fundraiser_1',
      privacy: { is_anonymous: false },
    },
  },
  prePaid: true,
};

describe('toDonationError (via donationService.createDonation)', () => {
  it('extracts platform field errors on a 400 response', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 400, {
        error_type: 'validation_failed',
        error_code: 'field_validation_failed',
        message: 'Validation failed with field errors.',
        parameters: { errors: { 'donor.city': ['form.city.invalid'] } },
      })
    );

    await expect(donationService.createDonation(payload)).rejects.toMatchObject(
      {
        name: 'DonationError',
        type: 'validation',
        code: 'VALIDATION_ERROR',
        status: 400,
        fieldErrors: { 'donor.city': ['form.city.invalid'] },
      } satisfies Partial<DonationError>
    );
  });

  it('extracts platform field errors on a 422 response', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 422, {
        parameters: { errors: { 'donor.zipCode': ['form.zipCode.invalid'] } },
      })
    );

    await expect(donationService.createDonation(payload)).rejects.toMatchObject(
      {
        name: 'DonationError',
        type: 'business',
        code: 'BUSINESS_LOGIC_ERROR',
        status: 422,
        fieldErrors: { 'donor.zipCode': ['form.zipCode.invalid'] },
      } satisfies Partial<DonationError>
    );
  });

  it('leaves fieldErrors unset when the body carries no parameters.errors map', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 400, { message: 'bad request' })
    );

    let caught: DonationError | undefined;
    try {
      await donationService.createDonation(payload);
    } catch (err) {
      caught = err as DonationError;
    }

    expect(caught?.status).toBe(400);
    expect(caught?.details).toMatchObject({ body: { message: 'bad request' } });
    expect(caught?.fieldErrors).toBeUndefined();
  });

  it('ignores a top-level errors key, which the platform does not send', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 400, { errors: { 'donor.city': ['nope'] } })
    );

    let caught: DonationError | undefined;
    try {
      await donationService.createDonation(payload);
    } catch (err) {
      caught = err as DonationError;
    }

    expect(caught?.fieldErrors).toBeUndefined();
  });

  it('does not extract field errors for a non-400/422 status', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 500, {
        parameters: { errors: { 'donor.city': ['form.city.invalid'] } },
      })
    );

    let caught: DonationError | undefined;
    try {
      await donationService.createDonation(payload);
    } catch (err) {
      caught = err as DonationError;
    }

    expect(caught?.status).toBe(500);
    expect(caught?.fieldErrors).toBeUndefined();
  });
});

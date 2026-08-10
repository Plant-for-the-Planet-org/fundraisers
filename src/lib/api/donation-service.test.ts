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
  it('preserves field-level errors on a 400 response', async () => {
    const fieldErrors = { email: 'is required' };
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 400, { errors: fieldErrors })
    );

    await expect(donationService.createDonation(payload)).rejects.toMatchObject(
      {
        name: 'DonationError',
        type: 'validation',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: {
          body: { errors: fieldErrors },
          errors: fieldErrors,
        },
      } satisfies Partial<DonationError>
    );
  });

  it('preserves field-level errors on a 422 response', async () => {
    const fieldErrors = { amount: 'must be positive' };
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 422, { errors: fieldErrors })
    );

    await expect(donationService.createDonation(payload)).rejects.toMatchObject(
      {
        name: 'DonationError',
        type: 'business',
        code: 'BUSINESS_LOGIC_ERROR',
        status: 422,
        details: {
          body: { errors: fieldErrors },
          errors: fieldErrors,
        },
      } satisfies Partial<DonationError>
    );
  });

  it('does not synthesize errors on a 400 response with no errors key', async () => {
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
    expect(caught?.details).not.toHaveProperty('errors');
  });

  it('does not extract errors for a non-400/422 status even if the body has an errors key', async () => {
    mockedPlatformFetch.mockRejectedValueOnce(
      new PlatformAPIError('http', 500, { errors: { oops: 'server' } })
    );

    let caught: DonationError | undefined;
    try {
      await donationService.createDonation(payload);
    } catch (err) {
      caught = err as DonationError;
    }

    expect(caught?.status).toBe(500);
    expect(caught?.details).not.toHaveProperty('errors');
  });
});

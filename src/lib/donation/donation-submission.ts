import type { DonationPayload } from '../types/donation';

import { DonationError, donationService } from '../api/donation-service';

export interface DonationSubmitError {
  /** Maps to a next-intl key via the UI layer, e.g. 'AUTH_ERROR' */
  code: string;
  /** Optional interpolation values for the translation */
  values?: Record<string, string | number>;
}

export interface DonationSubmitState {
  isLoading: boolean;
  isSuccess: boolean;
  donationId: string | null;
  error: DonationSubmitError | null;
}

export const INITIAL_DONATION_STATE: DonationSubmitState = {
  isLoading: false,
  isSuccess: false,
  donationId: null,
  error: null,
};

/** Standard payment: Two-step flow — create donation, then process payment */
export async function submitStandardDonation(
  payload: DonationPayload,
  token: string | undefined,
  donationIdempotencyKey: string
) {
  // Step 1: Create donation
  const donationResponse = await donationService.submitDonation(
    payload,
    token,
    donationIdempotencyKey
  );

  if (!donationResponse.donationId) {
    throw new DonationError(
      'Failed to create donation',
      'api',
      'DONATION_CREATION_ERROR',
      500
    );
  }

  // TODO Step 2: Process payment against the created donation

  return { donationResponse };
}

import type { DonationFrequency } from '../types/donation';
import type { ThankYouState } from '../types/donation-submit';

import { donationService } from '../api/donation-service';

/**
 * Fetches the donation once and maps the result to a ThankYouState.
 * - paid                          → { status: 'completed', donationId }
 * - gateway === 'offline' + account → { status: 'bankTransferPending', ...GET data }
 * - anything else                 → { status: 'paymentProcessing', donationId, paymentResult }
 * - GET error                     → fallback if provided, otherwise { status: 'paymentProcessing', paymentResult: 'pending' }
 */
export async function resolveThankYouStateFromGet(
  donationId: string,
  token?: string,
  fallback?: ThankYouState
): Promise<ThankYouState> {
  try {
    const donation = await donationService.getDonation(donationId, token);

    if (donation.paymentStatus === 'paid') {
      return { status: 'completed', donationId };
    }

    if (donation.gateway === 'offline' && donation.account) {
      return {
        status: 'bankTransferPending',
        donationId,
        uid: donation.uid,
        amount: donation.amount,
        currency: donation.currency,
        frequency: (donation.frequency as DonationFrequency) ?? 'once',
        transferAccount: donation.account,
      };
    }

    return {
      status: 'paymentProcessing',
      donationId,
      paymentResult: donation.paymentStatus,
    };
  } catch {
    return (
      fallback ?? {
        status: 'paymentProcessing',
        donationId,
        paymentResult: 'pending',
      }
    );
  }
}

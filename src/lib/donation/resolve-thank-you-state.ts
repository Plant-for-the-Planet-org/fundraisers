import type { DonationResponse } from '@/lib/types/donation';
import type { ThankYouState } from '@/lib/types/donation-submit';
import type { PaymentResponse } from '@/lib/types/payment';

/**
 * Maps a successful PaymentResponse to the appropriate ThankYouState,
 * or returns null for statuses that should keep the user in the flow.
 */
export function resolveThankYouState(
  response: PaymentResponse,
  donationResponse: DonationResponse
): ThankYouState | null {
  const { donationId, uid, amount, currency, frequency } = donationResponse;
  switch (response.status) {
    case 'success':
      // Future: handle other success responses from different payment methods here
      if (response.response?.type === 'transfer_required') {
        return {
          status: 'bankTransferPending',
          donationId,
          uid,
          amount,
          currency,
          frequency,
          transferAccount: response.response.account,
        };
      }
      return { status: 'completed', donationId };

    // thank you state is only associated with "success" status
    case 'action_required':
    case 'failed':
      return null;

    default:
      console.warn('Received unrecognized payment response status:', response);
      return null;
  }
}

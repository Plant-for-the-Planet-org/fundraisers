import type { PaymentResponse } from '@/lib/types/payment';
import type { SubmissionErrorKey } from '@/lib/types/submission-errors';

export interface DonationSubmitState {
  isLoading: boolean;
  isSuccess: boolean;
  donationId: string | null;
  transferDetails: PaymentResponse['response'] | null;
  error: DonationSubmitError | null;
}

export interface DonationSubmitError {
  /** Maps directly to a key under Donate.submissionErrors in locale JSON */
  code: SubmissionErrorKey;
}

export const INITIAL_DONATION_STATE: DonationSubmitState = {
  isLoading: false,
  isSuccess: false,
  donationId: null,
  transferDetails: null,
  error: null,
};

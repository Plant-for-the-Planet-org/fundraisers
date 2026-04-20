import type {
  DonationFrequency,
  DonationPaymentStatus,
} from '@/lib/types/donation';
import type { SubmissionErrorKey } from '@/lib/types/submission-errors';
import type { BankAccountDetails } from './payment';

// Discriminated union for thank-you screen variants
export type ThankYouState =
  | { status: 'completed'; donationId: string | null }
  | {
      status: 'bankTransferPending';
      donationId: string | null;
      uid: string | null;
      amount: number; // decimal, as returned by the API
      currency: string;
      frequency: DonationFrequency;
      transferAccount: BankAccountDetails;
    }
  | {
      status: 'paymentProcessing';
      donationId: string;
      paymentResult: DonationPaymentStatus;
    };

export interface DonationSubmitState {
  isLoading: boolean;
  thankYouState: ThankYouState | null;
  error: DonationSubmitError | null;
}

export interface DonationSubmitError {
  /** Maps directly to a key under Donate.submissionErrors in locale JSON */
  code: SubmissionErrorKey;
}

export const INITIAL_DONATION_STATE: DonationSubmitState = {
  isLoading: false,
  thankYouState: null,
  error: null,
};

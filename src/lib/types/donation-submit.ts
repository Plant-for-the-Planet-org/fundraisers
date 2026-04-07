import type { SubmissionErrorKey } from '@/lib/types/submission-errors';

// Bank account details returned when a bank transfer is required
interface BankAccountDetails {
  beneficiary: string;
  iban: string;
  bic: string;
  bankName: string;
}

// Discriminated union for thank-you screen variants
export type ThankYouState =
  | { status: 'completed'; donationId: string | null }
  | {
      status: 'bankTransferPending';
      donationId: string | null;
      uid: string | null;
      transferAccount: BankAccountDetails;
    };

export interface DonationSubmitState {
  isLoading: boolean;
  thankYou: ThankYouState | null;
  error: DonationSubmitError | null;
}

export interface DonationSubmitError {
  /** Maps directly to a key under Donate.submissionErrors in locale JSON */
  code: SubmissionErrorKey;
}

export const INITIAL_DONATION_STATE: DonationSubmitState = {
  isLoading: false,
  thankYou: null,
  error: null,
};

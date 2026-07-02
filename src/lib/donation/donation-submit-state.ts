import type {
  DonationSubmitState,
  ThankYouState,
} from '@/lib/types/donation-submit';
import type {
  ServiceErrorCode,
  SubmissionErrorKey,
} from '@/lib/types/submission-errors';

import { toSubmitError } from '@/lib/donation/donation-submit-errors';
import { SUBMISSION_ERROR_CODES } from '@/lib/types/submission-errors';

/**
 * Pure state-shaping helpers for the donation submission flow.
 *
 * These are extracted from `useDonationSubmission` so the hook reads as
 * orchestration rather than state-object plumbing. Everything here is a plain
 * function with no React or hook-state dependency, so it is safe to call from
 * any `setDonationState(...)` updater.
 */

export type DonationStateUpdater = (
  prev: DonationSubmitState
) => DonationSubmitState;

/** Result shape shared by the SEPA and card `createPaymentMethod` handles. */
export type StripePaymentMethodResult =
  | { paymentMethodId: string }
  | { error: string }
  | { validationFailed: true };

/** Start a fresh submission: enter loading, clear any prior success/error. */
export const beginSubmission: DonationStateUpdater = prev => ({
  ...prev,
  isLoading: true,
  thankYouState: null,
  error: null,
});

/** Leave loading without changing success/error (e.g. validation hand-off). */
export const stopLoading: DonationStateUpdater = prev => ({
  ...prev,
  isLoading: false,
});

/** Leave loading and surface an error code. */
export const withError =
  (code: SubmissionErrorKey): DonationStateUpdater =>
  prev => ({
    ...prev,
    isLoading: false,
    error: { code },
  });

/** Leave loading and apply a resolved thank-you state. */
export const withSuccess =
  (thankYouState: ThankYouState | null): DonationStateUpdater =>
  prev => ({
    ...prev,
    isLoading: false,
    thankYouState,
  });

/** Leave loading and surface a thrown error, normalized via toSubmitError. */
export const withSubmitError =
  (error: unknown): DonationStateUpdater =>
  prev => ({
    ...prev,
    isLoading: false,
    error: toSubmitError(error),
  });

/** Map a service-layer payment error code to a submission error key. */
export const mapPaymentErrorCode = (
  errorCode?: string | null
): SubmissionErrorKey =>
  errorCode
    ? (SUBMISSION_ERROR_CODES[errorCode as ServiceErrorCode] ?? 'paymentFailed')
    : 'paymentFailed';

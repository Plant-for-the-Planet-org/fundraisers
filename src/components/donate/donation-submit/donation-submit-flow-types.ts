import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { UserProfile } from '@/lib/api/user-service';
import type { DonationFormData, DonationPayload } from '@/lib/types/donation';
import type {
  DonationSubmitState,
  ThankYouState,
} from '@/lib/types/donation-submit';
import type { PaymentMethodId } from '@/lib/types/payment-methods';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { SubmissionErrorKey } from '@/lib/types/submission-errors';
import type { DonationFormValues } from '../donation-form-context';
import type { StripeCardFormHandle } from '../stripe-card-form';
import type { StripeSepaFormHandle } from '../stripe-sepa-form';

/**
 * Shared contract between `useSubmissionCore` and the per-gateway flow hooks
 * (`useStripeFlow`, `usePlanetCashFlow`, `usePayPalFlow`, `useWalletFlow`).
 *
 * Defining this explicitly - rather than relying on `ReturnType<typeof
 * useSubmissionCore>` - makes the core's surface reviewable and pins down what
 * the flows are allowed to read. In particular it documents the two rules the
 * Tier 2 split depends on:
 *
 * 1. The refs (`submittingRef`, `donationKeyRef`, `paymentKeyRef`) are SINGLE
 *    shared instances created once in the core. Every flow reads and writes the
 *    same objects; re-creating them per flow would silently break cross-flow
 *    mutual exclusion and idempotency.
 * 2. The core re-exposes the auth/config values the flows read directly
 *    (`token`, `donorProfile`, `paymentOptions`). Flows take these from the
 *    core and MUST NOT call `useAuthStore` themselves, so every flow sees the
 *    same value identity in its dependency arrays.
 *
 * `isAuthenticated` is intentionally absent: it is only consumed by
 * `createAttempt` inside the core and is not exposed.
 */
export interface SubmissionCore {
  // --- Lifecycle state -----------------------------------------------------
  donationState: DonationSubmitState;
  setDonationState: Dispatch<SetStateAction<DonationSubmitState>>;

  // --- Cross-flow guards and idempotency (single shared instances) ---------
  /** In-flight guard blocking concurrent submissions across all gateways. */
  submittingRef: RefObject<boolean>;
  /** Attempt-scoped idempotency key for the donation (createDonation) call. */
  donationKeyRef: RefObject<string>;
  /** Attempt-scoped idempotency key for the payment (processPayment) call. */
  paymentKeyRef: RefObject<string>;
  /** Issues fresh idempotency keys for the next donation/payment attempt. */
  rotateIdempotencyKeys: () => void;

  // --- Shared helpers (memoized once in the core) --------------------------
  /**
   * Starts a donation attempt for the given form values and payment method:
   * assembles the form data and API payload and returns the outcome helpers
   * bound to them. Flows report every result through the returned attempt.
   */
  createAttempt: (
    values: DonationFormValues,
    paymentMethod: PaymentMethodId
  ) => DonationAttempt;
  /**
   * Surfaces an error and clears the in-flight guard so the donor can retry.
   * Only for callbacks that fire outside any attempt (e.g. a wallet sheet
   * dismissed before submission); inside a flow use `attempt.fail`.
   */
  failSubmission: (code: SubmissionErrorKey) => void;
  /** Confirms a Stripe cardAction payment intent; fails the attempt and returns false on error. */
  confirmCardActionPayment: (
    attempt: DonationAttempt,
    params: ConfirmCardActionPaymentParams
  ) => Promise<boolean>;

  // --- Auth/config values the flows read directly --------------------------
  token: string | null;
  donorProfile: UserProfile | undefined;
  paymentOptions: PaymentOptions;
}

/**
 * One donation attempt: the data going to the API plus the outcome helpers
 * bound to it. Every flow reports its result through these, so the core owns
 * state transitions and measurement in one place.
 */
export interface DonationAttempt {
  formData: DonationFormData;
  payload: DonationPayload;
  paymentMethod: PaymentMethodId;
  /**
   * Records that the create-donation request is actually going out. Call it
   * right before that request, never straight after `createAttempt`: the
   * Stripe and PlanetCash paths can still bail out in between.
   */
  submitted: () => void;
  /** Surfaces an error and clears the in-flight guard so the donor can retry. */
  fail: (code: SubmissionErrorKey) => void;
  /** Resolves the thank-you state for a settled donation and applies success. */
  complete: (
    donationId: string,
    fallbackThankYouState?: ThankYouState
  ) => Promise<void>;
}

/** Parameters for `confirmCardActionPayment`. */
export interface ConfirmCardActionPaymentParams {
  donationId: string;
  account: string;
  paymentIntentId: string;
  paymentIdempotencyKey: string;
}

/**
 * Stripe-flow-only dependencies passed to `useStripeFlow` alongside the core.
 *
 * These are NOT part of the shared core: the two Stripe form refs and
 * `onPaymentValidationFailed` are consumed solely by the Stripe `onSubmit` path
 * (card + SEPA, including saved Stripe methods), the latter via
 * `classifyPaymentMethodResult`, which lives in `useStripeFlow` because both the
 * card and SEPA `createPaymentMethod` results flow through it.
 */
export interface StripeFlowDeps {
  sepaFormRef: RefObject<StripeSepaFormHandle | null>;
  cardFormRef: RefObject<StripeCardFormHandle | null>;
  onPaymentValidationFailed?: () => void;
}

import type { DonationSubmitState } from '@/lib/types/donation-submit';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { StripeCardActionConfirmRequest } from '@/lib/types/payment';
import type { PaymentMethodId } from '@/lib/types/payment-methods';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { SubmissionErrorKey } from '@/lib/types/submission-errors';
import type { DonationData } from '../donate-overlay';
import type { DonationFormValues } from '../donation-form-context';
import type {
  ConfirmCardActionPaymentParams,
  DonationAttempt,
  SubmissionCore,
} from './donation-submit-flow-types';

import { useCallback, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics/track';
import { paymentService } from '@/lib/api/payment-service';
import {
  mapPaymentErrorCode,
  withError,
  withSuccess,
} from '@/lib/donation/donation-submit-state';
import {
  assembleFormData,
  buildDonationPayload,
} from '@/lib/donation/payload-builder';
import { resolveThankYouStateFromDonation } from '@/lib/donation/resolve-donation-status';
import { INITIAL_DONATION_STATE } from '@/lib/types/donation-submit';
import { getDonationProcessingFeeInfo } from '@/lib/utils/donation-payment-fees';
import { generateIdempotencyKeyWithPrefix } from '@/lib/utils/idempotency';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Owns the state and helpers shared across every donation gateway flow.
 *
 * Created once per `useDonationSubmission` render and handed to each per-gateway
 * flow hook (`useStripeFlow`, `usePlanetCashFlow`, `usePayPalFlow`,
 * `useWalletFlow`). The refs it
 * returns (`submittingRef`, `donationKeyRef`, `paymentKeyRef`) are single
 * shared instances: cross-flow mutual exclusion and idempotency depend on every
 * flow reading and writing the same objects, so they must NOT be re-created
 * inside the flow hooks.
 *
 * Reads `useAuthStore` once and re-exposes the auth/config values the flows read
 * directly (`token`, `donorProfile`, `paymentOptions`). `isAuthenticated` stays
 * internal — only `createAttempt` consumes it.
 *
 * Intentionally does NOT own `paypalOrderRef` (PayPal-only) or
 * `classifyPaymentMethodResult` (card + sepa); those live in their owning flows.
 */
export function useSubmissionCore(
  donationData: DonationData,
  fundraiser: Fundraiser,
  paymentOptions: PaymentOptions
): SubmissionCore {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const donorProfile = useAuthStore(state => state.user?.profile);
  const token = useAuthStore(state => state.accessToken);

  const [donationState, setDonationState] = useState<DonationSubmitState>(
    INITIAL_DONATION_STATE
  );

  const submittingRef = useRef(false);
  // Stable idempotency keys across retries
  const donationKeyRef = useRef(generateIdempotencyKeyWithPrefix('donation'));
  const paymentKeyRef = useRef(generateIdempotencyKeyWithPrefix('payment'));

  // Issues a fresh idempotency key for the next donation/payment attempt.
  const rotateIdempotencyKeys = useCallback(() => {
    donationKeyRef.current = generateIdempotencyKeyWithPrefix('donation');
    paymentKeyRef.current = generateIdempotencyKeyWithPrefix('payment');
  }, []);

  const failSubmission = useCallback((code: SubmissionErrorKey) => {
    setDonationState(withError(code));
    submittingRef.current = false;
  }, []);

  const createAttempt = useCallback(
    (
      values: DonationFormValues,
      paymentMethod: PaymentMethodId
    ): DonationAttempt => {
      const formData = assembleFormData(
        donationData,
        fundraiser,
        values,
        isAuthenticated
      );

      const { processingFeeCents } = getDonationProcessingFeeInfo({
        paymentOptions,
        donationAmountCents: donationData.amountCents,
        donationCurrency: donationData.currency,
        workspaceCountry: fundraiser.workspace?.country,
        selectedPaymentMethod: paymentMethod,
      });

      const payload = buildDonationPayload(
        formData,
        fundraiser,
        donorProfile,
        paymentMethod,
        values.willAbsorbFee,
        processingFeeCents
      );

      // `amount` is a plain dimension. Umami sums `revenue` across every event, so only the settled event sends it, or one donation counts three times.
      const track = (name: string, extra?: Record<string, unknown>) =>
        trackEvent(name, {
          fundraiser: fundraiser.slug,
          amount: payload.amount,
          currency: payload.currency,
          frequency: payload.frequency,
          method: paymentMethod,
          country: 'donor' in payload ? payload.donor.country : undefined,
          signedIn: isAuthenticated,
          coversFee: values.willAbsorbFee && processingFeeCents > 0,
          // The "make it monthly" upsell on a one-off donation.
          upgradedToMonthly:
            donationData.frequency === 'once' &&
            payload.frequency === 'monthly',
          ...extra,
        });

      // Only a failure after the request went out is a donation failure. Form validation bail-outs and a dismissed wallet sheet stay out, so failures never exceed submissions and every donation_failed carries the full dimensions.
      let submitted = false;

      return {
        formData,
        payload,
        paymentMethod,
        // Fires on submit, not on settlement: a bank transfer counts here while the money is still pending.
        submitted: () => {
          submitted = true;
          track('donation_submitted');
        },
        fail: code => {
          if (submitted) track('donation_failed', { error: code });
          failSubmission(code);
        },
        complete: async (donationId, fallbackThankYouState) => {
          const thankYouState = await resolveThankYouStateFromDonation(
            donationId,
            token ?? undefined,
            fallbackThankYouState
          );
          setDonationState(withSuccess(thankYouState));
          // Revenue counts when paid. A confirmed SEPA mandate also counts: the platform holds it at initiated/pending until the debit settles days later, and the client never sees that. A pending bank transfer is only a promise and stays out, as is a status the client could not read.
          const status =
            thankYouState.status === 'completed'
              ? 'paid'
              : paymentMethod === 'sepa_debit' &&
                  thankYouState.status === 'paymentProcessing' &&
                  !thankYouState.unverified &&
                  (thankYouState.paymentResult === 'initiated' ||
                    thankYouState.paymentResult === 'pending')
                ? thankYouState.paymentResult
                : null;
          if (status) {
            track('donation_completed', { revenue: payload.amount, status });
          }
        },
      };
    },
    [
      donationData,
      fundraiser,
      paymentOptions,
      isAuthenticated,
      donorProfile,
      token,
      failSubmission,
    ]
  );

  // Confirms a Stripe cardAction payment intent with the platform. The cardAction call itself stays with the caller since each obtains the paymentIntentId differently.
  const confirmCardActionPayment = useCallback(
    async (
      attempt: DonationAttempt,
      params: ConfirmCardActionPaymentParams
    ): Promise<boolean> => {
      const confirmRequest: StripeCardActionConfirmRequest = {
        gateway: 'stripe',
        account: params.account,
        source: { id: params.paymentIntentId, object: 'payment_intent' },
      };
      const finalResponse = await paymentService.processPayment(
        params.donationId,
        confirmRequest,
        token ?? undefined,
        params.paymentIdempotencyKey
      );
      if (finalResponse.status === 'failed') {
        attempt.fail(mapPaymentErrorCode(finalResponse.errorCode));
        return false;
      }
      return true;
    },
    [token]
  );

  return {
    donationState,
    setDonationState,
    submittingRef,
    donationKeyRef,
    paymentKeyRef,
    rotateIdempotencyKeys,
    createAttempt,
    failSubmission,
    confirmCardActionPayment,
    token,
    donorProfile,
    paymentOptions,
  };
}

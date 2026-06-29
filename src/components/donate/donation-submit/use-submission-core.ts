import type {
  DonationSubmitState,
  ThankYouState,
} from '@/lib/types/donation-submit';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { StripeCardActionConfirmRequest } from '@/lib/types/payment';
import type { PaymentMethodId } from '@/lib/types/payment-methods';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { SubmissionErrorKey } from '@/lib/types/submission-errors';
import type { DonationData } from '../donate-overlay';
import type { DonationFormValues } from '../donation-form-context';
import type {
  ConfirmCardActionPaymentParams,
  SubmissionCore,
} from './donation-submit-flow-types';

import { useCallback, useRef, useState } from 'react';
import { paymentService } from '@/lib/api/payment-service';
import { withError, withSuccess } from '@/lib/donation/donation-submit-state';
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
 * internal — only `buildPayload` consumes it.
 *
 * Intentionally does NOT own `paypalDonationIdRef` (PayPal-only) or
 * `classifyPaymentMethodResult` (card-only); those live in their owning flows.
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

  // Surfaces an error and clears the in-flight guard so the donor can retry.
  const failSubmission = useCallback((code: SubmissionErrorKey) => {
    setDonationState(withError(code));
    submittingRef.current = false;
  }, []);

  // Resolves the thank-you state for a settled donation and applies it as success.
  const finalizeDonation = useCallback(
    async (
      donationId: string,
      token?: string,
      fallbackThankYouState?: ThankYouState
    ) => {
      const thankYouState = await resolveThankYouStateFromDonation(
        donationId,
        token,
        fallbackThankYouState
      );
      setDonationState(withSuccess(thankYouState));
    },
    []
  );

  // Assembles form data and the donation payload for a given payment method.
  const buildPayload = useCallback(
    (values: DonationFormValues, paymentMethod: PaymentMethodId) => {
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

      return { formData, payload };
    },
    [donationData, fundraiser, paymentOptions, isAuthenticated, donorProfile]
  );

  // Confirms a Stripe cardAction payment intent with the platform: builds the
  // confirm request, processes it, and surfaces failure. Returns true when the
  // confirm succeeded (caller proceeds to finalize), false when it failed
  // (state already set; caller should stop). The cardAction call itself stays
  // with the caller since each obtains the paymentIntentId differently.
  const confirmCardActionPayment = useCallback(
    async (params: ConfirmCardActionPaymentParams): Promise<boolean> => {
      const confirmRequest: StripeCardActionConfirmRequest = {
        gateway: 'stripe',
        account: params.account,
        source: { id: params.paymentIntentId, object: 'payment_intent' },
      };
      const finalResponse = await paymentService.processPayment(
        params.donationId,
        confirmRequest,
        params.token,
        params.paymentIdempotencyKey
      );
      if (finalResponse.status === 'failed') {
        setDonationState(withError('paymentFailed'));
        return false;
      }
      return true;
    },
    []
  );

  return {
    donationState,
    setDonationState,
    submittingRef,
    donationKeyRef,
    paymentKeyRef,
    rotateIdempotencyKeys,
    failSubmission,
    finalizeDonation,
    buildPayload,
    confirmCardActionPayment,
    token,
    donorProfile,
    paymentOptions,
  };
}

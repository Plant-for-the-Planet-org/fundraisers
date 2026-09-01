import type { DonationFormValues } from '../donation-form-context';
import type { SubmissionCore } from './donation-submit-flow-types';

import { useCallback } from 'react';
import { submitStandardPostpaidDonation } from '@/lib/donation/donation-submission';
import {
  beginSubmission,
  mapPaymentErrorCode,
  stopLoading,
  withError,
  withSubmitError,
} from '@/lib/donation/donation-submit-state';
import { resolveThankYouState } from '@/lib/donation/resolve-thank-you-state';

/**
 * Bank-transfer (offline) submission flow.
 *
 * Owns `onSubmit` for the offline path: it runs the standard two-step
 * (create donation -> process payment) call with no Stripe payment method and
 * empty `paymentDetails`. The offline gateway answers a successful submission
 * with `transfer_required`, which `resolveThankYouState` maps to
 * `bankTransferPending` (carrying the transfer account for the thank-you
 * screen). There is no `createPaymentMethod` step and no `action_required`
 * confirmation, so none of the Stripe-specific handling applies here.
 *
 * Shares the same `submittingRef` guard and idempotency-key rotation as the
 * other flows via `core`.
 */
export function useBankTransferFlow(core: SubmissionCore) {
  const {
    setDonationState,
    submittingRef,
    donationKeyRef,
    paymentKeyRef,
    rotateIdempotencyKeys,
    finalizeDonation,
    buildPayload,
    trackDonationSubmitted,
    token,
    paymentOptions,
  } = core;

  const onSubmit = useCallback(
    async (values: DonationFormValues) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      // Reset stale success state on new submit
      setDonationState(beginSubmission);

      const { formData, payload } = buildPayload(
        values,
        values.selectedPaymentMethod
      );

      const donationAttemptKey = donationKeyRef.current;
      const paymentAttemptKey = paymentKeyRef.current;

      try {
        trackDonationSubmitted(formData, values.selectedPaymentMethod);

        const { donationResponse, paymentResponse } =
          await submitStandardPostpaidDonation({
            payload,
            token: token || undefined,
            donationIdempotencyKey: donationAttemptKey,
            paymentIdempotencyKey: paymentAttemptKey,
            selectedPaymentMethod: 'bank_transfer',
            paymentOptions,
            paymentDetails: {},
          });

        if (paymentResponse.status === 'failed') {
          setDonationState(
            withError(mapPaymentErrorCode(paymentResponse.errorCode))
          );
          return;
        }

        if (paymentResponse.status === 'success') {
          const initialThankYouState = resolveThankYouState(
            paymentResponse,
            donationResponse
          );

          if (initialThankYouState?.status === 'bankTransferPending') {
            await finalizeDonation(
              donationResponse.donationId,
              token ?? undefined,
              initialThankYouState
            );
            return;
          }

          if (initialThankYouState?.status === 'completed') {
            await finalizeDonation(
              donationResponse.donationId,
              token ?? undefined
            );
            return;
          }
        }

        setDonationState(stopLoading);
      } catch (error) {
        setDonationState(withSubmitError(error));
      } finally {
        // Rotate keys once per completed submit attempt.
        rotateIdempotencyKeys();
        submittingRef.current = false;
      }
    },
    [
      paymentOptions,
      token,
      rotateIdempotencyKeys,
      finalizeDonation,
      buildPayload,
      trackDonationSubmitted,
      submittingRef,
      setDonationState,
      donationKeyRef,
      paymentKeyRef,
    ]
  );

  return { onSubmit };
}

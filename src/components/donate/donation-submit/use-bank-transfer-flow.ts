import type { DonationFormValues } from '../donation-form-context';
import type { SubmissionCore } from './donation-submit-flow-types';

import { useCallback } from 'react';
import { submitStandardPostpaidDonation } from '@/lib/donation/donation-submission';
import { toSubmitError } from '@/lib/donation/donation-submit-errors';
import {
  beginSubmission,
  mapPaymentErrorCode,
  stopLoading,
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
    createAttempt,
    token,
    paymentOptions,
  } = core;

  const onSubmit = useCallback(
    async (values: DonationFormValues) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      // Reset stale success state on new submit
      setDonationState(beginSubmission);

      const attempt = createAttempt(values, values.selectedPaymentMethod);

      const donationAttemptKey = donationKeyRef.current;
      const paymentAttemptKey = paymentKeyRef.current;

      try {
        attempt.submitted();

        const { donationResponse, paymentResponse } =
          await submitStandardPostpaidDonation({
            payload: attempt.payload,
            token: token || undefined,
            donationIdempotencyKey: donationAttemptKey,
            paymentIdempotencyKey: paymentAttemptKey,
            selectedPaymentMethod: 'bank_transfer',
            paymentOptions,
            paymentDetails: {},
          });

        if (paymentResponse.status === 'failed') {
          attempt.fail(mapPaymentErrorCode(paymentResponse.errorCode));
          return;
        }

        if (paymentResponse.status === 'success') {
          const initialThankYouState = resolveThankYouState(
            paymentResponse,
            donationResponse
          );

          if (initialThankYouState?.status === 'bankTransferPending') {
            await attempt.complete(
              donationResponse.donationId,
              initialThankYouState
            );
            return;
          }

          if (initialThankYouState?.status === 'completed') {
            await attempt.complete(donationResponse.donationId);
            return;
          }
        }

        setDonationState(stopLoading);
      } catch (error) {
        attempt.fail(toSubmitError(error).code);
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
      createAttempt,
      submittingRef,
      setDonationState,
      donationKeyRef,
      paymentKeyRef,
    ]
  );

  return { onSubmit };
}

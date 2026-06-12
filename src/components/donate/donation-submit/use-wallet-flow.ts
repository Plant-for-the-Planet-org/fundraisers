import type { Stripe } from '@stripe/stripe-js';
import type { DonationFormValues } from '../donation-form-context';
import type { SubmissionCore } from './donation-submit-flow-types';

import { useCallback } from 'react';
import { submitStandardPostpaidDonation } from '@/lib/donation/donation-submission';
import {
  beginSubmission,
  mapPaymentErrorCode,
  withError,
  withSubmitError,
} from '@/lib/donation/donation-submit-state';

/**
 * Wallet (Apple Pay / Google Pay) submission flow.
 *
 * Owns the three wallet callbacks. `onWalletConfirm` runs the standard
 * two-step postpaid path (createDonation + processPayment) for the wallet
 * payment method, classifying the response into success / failure /
 * action_required and resolving any Stripe `cardAction` / `cardPayment`
 * challenge. Like `onSubmit`, it reuses the attempt-scoped idempotency keys for
 * `action_required` follow-ups and rotates them in its `finally` on every
 * attempt.
 *
 * Shares `submittingRef`, the idempotency-key refs, and the other helpers with
 * the remaining flows via `core`.
 */
export function useWalletFlow(core: SubmissionCore) {
  const {
    setDonationState,
    submittingRef,
    donationKeyRef,
    paymentKeyRef,
    rotateIdempotencyKeys,
    failSubmission,
    finalizeFromDonation,
    buildPayloadFor,
    confirmCardActionPayment,
    token,
    paymentOptions,
  } = core;

  const onWalletConfirm = useCallback(
    async (
      wallet: 'apple_pay' | 'google_pay',
      values: DonationFormValues,
      paymentMethodId: string,
      stripe: Stripe
    ): Promise<void> => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      setDonationState(beginSubmission);

      const { payload } = buildPayloadFor(values, wallet);

      const donationAttemptKey = donationKeyRef.current;
      const paymentAttemptKey = paymentKeyRef.current;

      try {
        const { donationResponse, paymentResponse } =
          await submitStandardPostpaidDonation({
            payload,
            token: token || undefined,
            donationIdempotencyKey: donationAttemptKey,
            paymentIdempotencyKey: paymentAttemptKey,
            selectedPaymentMethod: wallet,
            paymentOptions,
            paymentDetails: { paymentMethodId },
          });

        if (paymentResponse.status === 'failed') {
          setDonationState(
            withError(mapPaymentErrorCode(paymentResponse.errorCode))
          );
          return;
        }

        if (paymentResponse.status === 'success') {
          await finalizeFromDonation(
            donationResponse.donationId,
            token ?? undefined
          );
          return;
        }

        if (paymentResponse.status === 'action_required') {
          if (paymentResponse.response.type === 'cardAction') {
            const { paymentIntent, error } = await stripe.handleCardAction(
              paymentResponse.response.payment_intent_client_secret
            );
            if (error || !paymentIntent) {
              setDonationState(withError('paymentFailed'));
              return;
            }

            const confirmed = await confirmCardActionPayment({
              donationId: donationResponse.donationId,
              account: paymentResponse.response.account,
              paymentIntentId: paymentIntent.id,
              token: token || undefined,
              paymentIdempotencyKey: paymentAttemptKey,
            });
            if (!confirmed) return;
          } else if (paymentResponse.response.type === 'cardPayment') {
            const { error } = await stripe.confirmCardPayment(
              paymentResponse.response.payment_intent_client_secret,
              { payment_method: paymentResponse.response.payment_method }
            );
            if (error) {
              setDonationState(withError('paymentFailed'));
              return;
            }
          } else {
            // Unknown action_required type — payment status indeterminate.
            setDonationState(withError('unexpected'));
            return;
          }

          await finalizeFromDonation(
            donationResponse.donationId,
            token ?? undefined
          );
        }
      } catch (error) {
        setDonationState(withSubmitError(error));
      } finally {
        rotateIdempotencyKeys();
        submittingRef.current = false;
      }
    },
    [
      paymentOptions,
      token,
      rotateIdempotencyKeys,
      finalizeFromDonation,
      buildPayloadFor,
      confirmCardActionPayment,
      submittingRef,
      setDonationState,
      donationKeyRef,
      paymentKeyRef,
    ]
  );

  // Surfaces client-side Stripe.js failures (elements.submit or createPaymentMethod).
  // Server-side failures in the donation/payment APIs are
  // already handled inside onWalletConfirm.
  const onWalletError = useCallback(() => {
    failSubmission('paymentFailed');
  }, [failSubmission]);

  // Handles donor-initiated dismissal of the Apple Pay / Google Pay sheet.
  const onWalletCancel = useCallback(() => {
    failSubmission('paymentCancelled');
  }, [failSubmission]);

  return { onWalletConfirm, onWalletError, onWalletCancel };
}

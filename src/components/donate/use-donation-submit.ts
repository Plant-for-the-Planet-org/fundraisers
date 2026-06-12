import type { RefObject } from 'react';
import type { Stripe } from '@stripe/stripe-js';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { DonationData } from './donate-overlay';
import type { DonationFormValues } from './donation-form-context';
import type { StripeCardFormHandle } from './stripe-card-form';
import type { StripeSepaFormHandle } from './stripe-sepa-form';

import { useCallback } from 'react';
import { submitStandardPostpaidDonation } from '@/lib/donation/donation-submission';
import {
  beginSubmission,
  mapPaymentErrorCode,
  withError,
  withSubmitError,
} from '@/lib/donation/donation-submit-state';
import { INITIAL_DONATION_STATE } from '@/lib/types/donation-submit';
import { useBankTransferFlow } from './donation-submit/use-bank-transfer-flow';
import { usePayPalFlow } from './donation-submit/use-paypal-flow';
import { usePlanetCashFlow } from './donation-submit/use-planet-cash-flow';
import { useStripeFlow } from './donation-submit/use-stripe-flow';
import { useSubmissionCore } from './donation-submit/use-submission-core';

/**
 * Encapsulates the full donation submission flow:
 * assembles form data, builds the payload, submits via the appropriate
 * strategy (PlanetCash vs. standard two-step), and classifies the
 * payment response into a UI action.
 *
 * Returns `{ state, onSubmit, reset }`.
 */
export function useDonationSubmit(
  donationData: DonationData,
  fundraiser: Fundraiser,
  paymentOptions: PaymentOptions,
  sepaFormRef: RefObject<StripeSepaFormHandle | null>,
  cardFormRef: RefObject<StripeCardFormHandle | null>,
  onPaymentValidationFailed?: () => void
) {
  const core = useSubmissionCore(donationData, fundraiser, paymentOptions);
  const {
    donationState,
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
  } = core;

  const { onSubmit: onStripeSubmit } = useStripeFlow(core, {
    sepaFormRef,
    cardFormRef,
    onPaymentValidationFailed,
  });
  const { onSubmit: onPlanetCashSubmit } = usePlanetCashFlow(core);
  const { onSubmit: onBankTransferSubmit } = useBankTransferFlow(core);
  const { onPayPalCreateOrder, onPayPalApproved, onPayPalError } =
    usePayPalFlow(core);

  // Single form submit handler: dispatches by selected method to the prepaid
  // PlanetCash path, the offline bank-transfer path, or the Stripe path
  // (card / SEPA / saved methods).
  const onSubmit = useCallback(
    (values: DonationFormValues) => {
      switch (values.selectedPaymentMethod) {
        case 'planet_cash':
          return onPlanetCashSubmit(values);
        case 'bank_transfer':
          return onBankTransferSubmit(values);
        default:
          return onStripeSubmit(values);
      }
    },
    [onPlanetCashSubmit, onBankTransferSubmit, onStripeSubmit]
  );

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

  const reset = useCallback(() => {
    setDonationState(INITIAL_DONATION_STATE);
    rotateIdempotencyKeys();
  }, [rotateIdempotencyKeys, setDonationState]);

  return {
    donationState,
    onSubmit,
    onPayPalCreateOrder,
    onPayPalApproved,
    onPayPalError,
    onWalletConfirm,
    onWalletError,
    onWalletCancel,
    reset,
  };
}

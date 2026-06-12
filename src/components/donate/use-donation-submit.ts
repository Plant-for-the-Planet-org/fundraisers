import type { RefObject } from 'react';
import type { OnApproveData } from '@paypal/paypal-js';
import type { Stripe } from '@stripe/stripe-js';
import type { StripePaymentMethodResult } from '@/lib/donation/donation-submit-state';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentData } from '@/lib/types/payment';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { DonationData } from './donate-overlay';
import type { DonationFormValues } from './donation-form-context';
import type { StripeCardFormHandle } from './stripe-card-form';
import type { StripeSepaFormHandle } from './stripe-sepa-form';

import { useCallback, useRef } from 'react';
import { donationService } from '@/lib/api/donation-service';
import { paymentService } from '@/lib/api/payment-service';
import {
  createPaypalOrder,
  PaypalOrderError,
} from '@/lib/api/paypal-order-service';
import { buildDonorBillingAddress } from '@/lib/donation/donation-address';
import {
  submitPrepaidDonation,
  submitStandardPostpaidDonation,
} from '@/lib/donation/donation-submission';
import { toSubmitError } from '@/lib/donation/donation-submit-errors';
import {
  beginSubmission,
  mapPaymentErrorCode,
  stopLoading,
  withError,
  withSubmitError,
} from '@/lib/donation/donation-submit-state';
import { resolveThankYouState } from '@/lib/donation/resolve-thank-you-state';
import { INITIAL_DONATION_STATE } from '@/lib/types/donation-submit';
import { buildPaymentRequest } from '@/lib/utils/payment-request-builder';
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
    donorProfile,
  } = core;

  // Shares donationId between the two PayPal callbacks
  const paypalDonationIdRef = useRef<string | null>(null);

  // Classifies a Stripe createPaymentMethod result, applying the matching UI
  // side effect. Returns the paymentDetails to continue with, or null when the
  // result was handled (error/validation) and the caller should stop.
  const resolveCreatedPaymentMethod = useCallback(
    (
      result: StripePaymentMethodResult | undefined
    ): { paymentMethodId: string } | null => {
      if (!result) {
        setDonationState(withError('paymentFailed'));
        return null;
      }
      if ('validationFailed' in result) {
        setDonationState(stopLoading);
        onPaymentValidationFailed?.();
        return null;
      }
      if ('error' in result) {
        setDonationState(withError('paymentFailed'));
        return null;
      }
      return { paymentMethodId: result.paymentMethodId };
    },
    [onPaymentValidationFailed, setDonationState]
  );

  const onSubmit = useCallback(
    async (values: DonationFormValues) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      // Reset stale success state on new submit
      setDonationState(beginSubmission);

      const { formData, payload } = buildPayloadFor(
        values,
        values.selectedPaymentMethod
      );

      let paymentDetails: PaymentData['paymentDetails'] = {};
      const donationAttemptKey = donationKeyRef.current;
      const paymentAttemptKey = paymentKeyRef.current;

      try {
        // PlanetCash: single POST, balance deducted immediately — no PUT step needed.
        if (values.selectedPaymentMethod === 'planet_cash') {
          if (!token) {
            setDonationState(withError('unexpected'));
            return;
          }
          const donationResponse = await submitPrepaidDonation(
            payload,
            token,
            donationAttemptKey
          );
          await finalizeFromDonation(donationResponse.donationId, token);
        } else {
          if (values.selectedSavedMethodId) {
            // Reusing a saved card/SEPA method: the Stripe payment method
            // already exists, so skip creation and pass its id straight through
            // as the donation source.
            paymentDetails = { paymentMethodId: values.selectedSavedMethodId };
          } else if (values.selectedPaymentMethod === 'sepa_debit') {
            const donor = formData.type === 'guest' ? formData.donor : null;
            const sepaResult = await sepaFormRef.current?.createPaymentMethod({
              email: donor?.email ?? donorProfile?.email ?? '',
              address: buildDonorBillingAddress(
                donor,
                donorProfile,
                values.selectedAddressId
              ),
            });

            const resolved = resolveCreatedPaymentMethod(sepaResult);
            if (!resolved) return;
            paymentDetails = resolved;
          } else if (values.selectedPaymentMethod === 'card') {
            const donor = formData.type === 'guest' ? formData.donor : null;
            const cardResult = await cardFormRef.current?.createPaymentMethod({
              email: donor?.email ?? donorProfile?.email ?? '',
              donorAddress: buildDonorBillingAddress(
                donor,
                donorProfile,
                values.selectedAddressId
              ),
            });

            const resolved = resolveCreatedPaymentMethod(cardResult);
            if (!resolved) return;
            paymentDetails = resolved;
          }

          const { donationResponse, paymentResponse } =
            await submitStandardPostpaidDonation({
              payload,
              token: token || undefined,
              donationIdempotencyKey: donationAttemptKey,
              paymentIdempotencyKey: paymentAttemptKey,
              selectedPaymentMethod: values.selectedPaymentMethod,
              paymentOptions,
              paymentDetails,
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
              await finalizeFromDonation(
                donationResponse.donationId,
                token ?? undefined,
                initialThankYouState
              );
              return;
            }

            if (initialThankYouState?.status === 'completed') {
              await finalizeFromDonation(
                donationResponse.donationId,
                token ?? undefined
              );
              return;
            }
          }

          // NOTE: Reuse attempt-scoped idempotency keys for action_required follow-up calls.
          // Keys are rotated after this submit attempt completes (in finally).
          if (paymentResponse.status === 'action_required') {
            if (
              paymentResponse.response.type === 'cardAction' &&
              values.selectedPaymentMethod === 'card'
            ) {
              const actionResult = (await cardFormRef.current?.handleCardAction(
                paymentResponse.response.payment_intent_client_secret
              )) ?? { error: 'No card form available' };

              if ('error' in actionResult) {
                setDonationState(withError('paymentFailed'));
                return;
              }

              const confirmed = await confirmCardActionPayment({
                donationId: donationResponse.donationId,
                account: paymentResponse.response.account,
                paymentIntentId: actionResult.paymentIntentId,
                token: token || undefined,
                paymentIdempotencyKey: paymentAttemptKey,
              });
              if (!confirmed) return;

              await finalizeFromDonation(
                donationResponse.donationId,
                token ?? undefined
              );
              return;
            }

            if (
              paymentResponse.response.type === 'cardPayment' &&
              values.selectedPaymentMethod === 'card'
            ) {
              const confirmResult =
                (await cardFormRef.current?.confirmCardPayment(
                  paymentResponse.response.payment_intent_client_secret,
                  paymentResponse.response.payment_method
                )) ?? { error: 'No card form available' };

              if (confirmResult.error) {
                setDonationState(withError('paymentFailed'));
                return;
              }

              await finalizeFromDonation(
                donationResponse.donationId,
                token ?? undefined
              );
              return;
            }

            if (values.selectedPaymentMethod === 'sepa_debit') {
              const sepaResult =
                (await sepaFormRef.current?.confirmSepaDebitPayment(
                  paymentResponse.response.payment_intent_client_secret
                )) ?? { error: 'No SEPA form available' };

              if (sepaResult.error) {
                setDonationState(withError('paymentFailed'));
              } else {
                await finalizeFromDonation(
                  donationResponse.donationId,
                  token ?? undefined
                );
              }
              return;
            }
          }

          setDonationState(stopLoading);
        }
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
      donorProfile,
      token,
      sepaFormRef,
      cardFormRef,
      resolveCreatedPaymentMethod,
      confirmCardActionPayment,
      rotateIdempotencyKeys,
      finalizeFromDonation,
      buildPayloadFor,
      submittingRef,
      setDonationState,
      donationKeyRef,
      paymentKeyRef,
    ]
  );

  // TODO: PayPal callbacks share submittingRef, donationKeyRef, paymentKeyRef, and the other hook deps with onSubmit. When adding Stripe, consider extracting usePayPalFlow / useStripeFlow as internal composables that receive shared refs/state as arguments, keeping useDonationSubmit as the orchestrator.
  const onPayPalCreateOrder = useCallback(
    async (values: DonationFormValues): Promise<string> => {
      if (submittingRef.current)
        throw new Error('Submission already in progress');
      submittingRef.current = true;

      setDonationState(beginSubmission);

      const { payload } = buildPayloadFor(values, values.selectedPaymentMethod);

      try {
        const donationResponse = await donationService.createDonation(
          payload,
          token || undefined,
          donationKeyRef.current
        );
        paypalDonationIdRef.current = donationResponse.donationId;

        const paypalAccount = paymentOptions.gateways.paypal?.account;
        if (!paypalAccount) {
          throw new PaypalOrderError(
            'Missing PayPal account configuration',
            'api',
            'PAYPAL_ACCOUNT_MISSING'
          );
        }
        const orderId = await createPaypalOrder(
          donationResponse.donationId,
          paypalAccount,
          token || undefined
        );

        return orderId;
      } catch (error) {
        setDonationState(prev => ({
          ...prev,
          error: toSubmitError(error),
        }));
        throw error;
      } finally {
        setDonationState(stopLoading);
        submittingRef.current = false;
      }
    },
    [
      paymentOptions,
      token,
      buildPayloadFor,
      submittingRef,
      setDonationState,
      donationKeyRef,
    ]
  );

  const onPayPalApproved = useCallback(
    async (data: OnApproveData): Promise<void> => {
      const donationId = paypalDonationIdRef.current;
      if (!donationId) {
        failSubmission('unexpected');
        return;
      }

      const paymentData: PaymentData = {
        donationId,
        paymentMethod: 'paypal',
        paymentDetails: {
          orderID: data.orderID,
          payerID: data.payerID ?? undefined,
          paymentID: data.paymentID ?? undefined,
          billingToken: data.billingToken ?? undefined,
          facilitatorAccessToken: data.facilitatorAccessToken ?? undefined,
        },
      };

      try {
        const paymentRequest = buildPaymentRequest(paymentData, paymentOptions);
        const paymentResponse = await paymentService.processPayment(
          donationId,
          paymentRequest,
          token || undefined,
          paymentKeyRef.current
        );

        if (paymentResponse.status === 'failed') {
          setDonationState(
            withError(mapPaymentErrorCode(paymentResponse.errorCode))
          );
          return;
        }

        rotateIdempotencyKeys();

        await finalizeFromDonation(donationId, token ?? undefined);
      } catch (error) {
        setDonationState(withSubmitError(error));
      } finally {
        submittingRef.current = false;
      }
    },
    [
      paymentOptions,
      token,
      rotateIdempotencyKeys,
      finalizeFromDonation,
      failSubmission,
      submittingRef,
      setDonationState,
      paymentKeyRef,
    ]
  );

  const onPayPalError = useCallback(() => {
    failSubmission('paypalPaymentError');
  }, [failSubmission]);

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

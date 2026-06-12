import type { StripePaymentMethodResult } from '@/lib/donation/donation-submit-state';
import type { PaymentData } from '@/lib/types/payment';
import type { DonationFormValues } from '../donation-form-context';
import type {
  StripeFlowDeps,
  SubmissionCore,
} from './donation-submit-flow-types';

import { useCallback } from 'react';
import { buildDonorBillingAddress } from '@/lib/donation/donation-address';
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
 * Stripe submission flow: card, SEPA, and saved Stripe methods.
 *
 * Owns `onSubmit` for the Stripe-backed standard (two-step) donation path and
 * the `resolveCreatedPaymentMethod` helper. The latter handles both card and
 * SEPA `createPaymentMethod` results, so it lives here rather than in the core;
 * its only dependency, `onPaymentValidationFailed`, is passed in as a flow dep.
 *
 * PlanetCash is NOT handled here - it uses the prepaid single-POST path and
 * lives in `usePlanetCashFlow`. The orchestrator dispatches `planet_cash`
 * submissions there before this flow is reached.
 */
export function useStripeFlow(
  core: SubmissionCore,
  { sepaFormRef, cardFormRef, onPaymentValidationFailed }: StripeFlowDeps
) {
  const {
    setDonationState,
    submittingRef,
    donationKeyRef,
    paymentKeyRef,
    rotateIdempotencyKeys,
    finalizeFromDonation,
    buildPayloadFor,
    confirmCardActionPayment,
    token,
    donorProfile,
    paymentOptions,
  } = core;

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
      // PlanetCash (prepaid) and bank transfer (offline) have their own flows;
      // the orchestrator never routes them here. This guard documents that and
      // narrows selectedPaymentMethod to the Stripe-backed methods below.
      if (
        values.selectedPaymentMethod === 'planet_cash' ||
        values.selectedPaymentMethod === 'bank_transfer'
      ) {
        return;
      }

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
          // Stripe card/SEPA success always resolves to 'completed'. The
          // 'transfer_required' -> 'bankTransferPending' outcome is offline-only
          // and handled in useBankTransferFlow.
          const initialThankYouState = resolveThankYouState(
            paymentResponse,
            donationResponse
          );

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

  return { onSubmit };
}

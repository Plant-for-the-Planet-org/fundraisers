import type { RefObject } from 'react';
import type { OnApproveData } from '@paypal/paypal-js';
import type { Stripe } from '@stripe/stripe-js';
import type {
  DonationSubmitState,
  ThankYouState,
} from '@/lib/types/donation-submit';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type {
  PaymentData,
  StripeCardActionConfirmRequest,
} from '@/lib/types/payment';
import type { PaymentMethodId } from '@/lib/types/payment-methods';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type {
  ServiceErrorCode,
  SubmissionErrorKey,
} from '@/lib/types/submission-errors';
import type { DonationData } from './donate-overlay';
import type { DonationFormValues } from './donation-form-context';
import type { StripeCardFormHandle } from './stripe-card-form';
import type { StripeSepaFormHandle } from './stripe-sepa-form';

import { useCallback, useRef, useState } from 'react';
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
  assembleFormData,
  buildDonationPayload,
} from '@/lib/donation/payload-builder';
import { resolveThankYouStateFromDonation } from '@/lib/donation/resolve-donation-status';
import { resolveThankYouState } from '@/lib/donation/resolve-thank-you-state';
import { INITIAL_DONATION_STATE } from '@/lib/types/donation-submit';
import { SUBMISSION_ERROR_CODES } from '@/lib/types/submission-errors';
import { getDonationProcessingFeeInfo } from '@/lib/utils/donation-payment-fees';
import { generateIdempotencyKeyWithPrefix } from '@/lib/utils/idempotency';
import { buildPaymentRequest } from '@/lib/utils/payment-request-builder';
import { useAuthStore } from '@/stores/auth-store';

type DonationStateUpdater = (prev: DonationSubmitState) => DonationSubmitState;

/** Result shape shared by the SEPA and card `createPaymentMethod` handles. */
type StripePaymentMethodResult =
  | { paymentMethodId: string }
  | { error: string }
  | { validationFailed: true };

/** Start a fresh submission: enter loading, clear any prior success/error. */
const beginSubmission: DonationStateUpdater = prev => ({
  ...prev,
  isLoading: true,
  thankYouState: null,
  error: null,
});

/** Leave loading without changing success/error (e.g. validation hand-off). */
const stopLoading: DonationStateUpdater = prev => ({
  ...prev,
  isLoading: false,
});

/** Leave loading and surface an error code. */
const withError =
  (code: SubmissionErrorKey): DonationStateUpdater =>
  prev => ({
    ...prev,
    isLoading: false,
    error: { code },
  });

/** Leave loading and apply a resolved thank-you state. */
const withSuccess =
  (thankYouState: ThankYouState | null): DonationStateUpdater =>
  prev => ({
    ...prev,
    isLoading: false,
    thankYouState,
  });

/** Map a service-layer payment error code to a submission error key. */
const mapPaymentErrorCode = (errorCode?: string | null): SubmissionErrorKey =>
  errorCode
    ? (SUBMISSION_ERROR_CODES[errorCode as ServiceErrorCode] ?? 'paymentFailed')
    : 'paymentFailed';

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
  // Shares donationId between the two PayPal callbacks
  const paypalDonationIdRef = useRef<string | null>(null);

  // Issues a fresh idempotency key for the next donation/payment attempt.
  const rotateIdempotencyKeys = useCallback(() => {
    donationKeyRef.current = generateIdempotencyKeyWithPrefix('donation');
    paymentKeyRef.current = generateIdempotencyKeyWithPrefix('payment');
  }, []);

  // Resolves the thank-you state for a settled donation and applies it as success.
  const finalizeFromDonation = useCallback(
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
  const buildPayloadFor = useCallback(
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
    [onPaymentValidationFailed]
  );

  // Confirms a Stripe cardAction payment intent with the platform: builds the
  // confirm request, processes it, and surfaces failure. Returns true when the
  // confirm succeeded (caller proceeds to finalize), false when it failed
  // (state already set; caller should stop). The cardAction call itself stays
  // with the caller since each obtains the paymentIntentId differently.
  const confirmCardActionPayment = useCallback(
    async (params: {
      donationId: string;
      account: string;
      paymentIntentId: string;
      token?: string;
      paymentIdempotencyKey: string;
    }): Promise<boolean> => {
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
        setDonationState(prev => ({
          ...prev,
          isLoading: false,
          error: toSubmitError(error),
        }));
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
    [paymentOptions, token, buildPayloadFor]
  );

  const onPayPalApproved = useCallback(
    async (data: OnApproveData): Promise<void> => {
      const donationId = paypalDonationIdRef.current;
      if (!donationId) {
        setDonationState(withError('unexpected'));
        submittingRef.current = false;
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
        setDonationState(prev => ({
          ...prev,
          isLoading: false,
          error: toSubmitError(error),
        }));
      } finally {
        submittingRef.current = false;
      }
    },
    [paymentOptions, token, rotateIdempotencyKeys, finalizeFromDonation]
  );

  const onPayPalError = useCallback(() => {
    setDonationState(withError('paypalPaymentError'));
    submittingRef.current = false;
  }, []);

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
        setDonationState(prev => ({
          ...prev,
          isLoading: false,
          error: toSubmitError(error),
        }));
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
    ]
  );
  // Surfaces client-side Stripe.js failures (elements.submit or createPaymentMethod).
  // Server-side failures in the donation/payment APIs are
  // already handled inside onWalletConfirm.
  const onWalletError = useCallback(() => {
    setDonationState(withError('paymentFailed'));
    submittingRef.current = false;
  }, []);

  // Handles donor-initiated dismissal of the Apple Pay / Google Pay sheet.
  const onWalletCancel = useCallback(() => {
    setDonationState(withError('paymentCancelled'));
    submittingRef.current = false;
  }, []);

  const reset = useCallback(() => {
    setDonationState(INITIAL_DONATION_STATE);
    rotateIdempotencyKeys();
  }, [rotateIdempotencyKeys]);

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

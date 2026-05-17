import type { RefObject } from 'react';
import type { OnApproveData } from '@paypal/paypal-js';
import type { Stripe } from '@stripe/stripe-js';
import type { DonationSubmitState } from '@/lib/types/donation-submit';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type {
  PaymentData,
  StripeCardActionConfirmRequest,
} from '@/lib/types/payment';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { ServiceErrorCode } from '@/lib/types/submission-errors';
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
  cardFormRef: RefObject<StripeCardFormHandle | null>
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

  const onSubmit = useCallback(
    async (values: DonationFormValues) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      // Reset stale success state on new submit
      setDonationState(prev => ({
        ...prev,
        isLoading: true,
        thankYouState: null,
        error: null,
      }));

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
        selectedPaymentMethod: values.selectedPaymentMethod,
      });

      const payload = buildDonationPayload(
        formData,
        fundraiser,
        donorProfile,
        values.selectedPaymentMethod,
        values.willAbsorbFee,
        processingFeeCents
      );

      let paymentDetails: PaymentData['paymentDetails'] = {};
      const donationAttemptKey = donationKeyRef.current;
      const paymentAttemptKey = paymentKeyRef.current;

      try {
        // PlanetCash: single POST, balance deducted immediately — no PUT step needed.
        if (values.selectedPaymentMethod === 'planet_cash') {
          if (!token) {
            setDonationState(prev => ({
              ...prev,
              isLoading: false,
              error: { code: 'unexpected' },
            }));
            return;
          }
          const donationResponse = await submitPrepaidDonation(
            payload,
            token,
            donationAttemptKey
          );
          const thankYouState = await resolveThankYouStateFromDonation(
            donationResponse.donationId,
            token
          );
          setDonationState(prev => ({
            ...prev,
            isLoading: false,
            thankYouState,
          }));
        } else {
          if (values.selectedPaymentMethod === 'sepa_debit') {
            const donor = formData.type === 'guest' ? formData.donor : null;
            const sepaResult = await sepaFormRef.current?.createPaymentMethod({
              email: donor?.email ?? donorProfile?.email ?? '',
              address: buildDonorBillingAddress(
                donor,
                donorProfile,
                values.selectedAddressId
              ),
            });

            if (!sepaResult || 'error' in sepaResult) {
              setDonationState(prev => ({
                ...prev,
                isLoading: false,
                error: { code: 'paymentFailed' },
              }));
              return;
            }

            paymentDetails = { paymentMethodId: sepaResult.paymentMethodId };
          }

          if (values.selectedPaymentMethod === 'card') {
            const donor = formData.type === 'guest' ? formData.donor : null;
            const cardResult = await cardFormRef.current?.createPaymentMethod({
              email: donor?.email ?? donorProfile?.email ?? '',
              donorAddress: buildDonorBillingAddress(
                donor,
                donorProfile,
                values.selectedAddressId
              ),
            });

            if (!cardResult || 'error' in cardResult) {
              setDonationState(prev => ({
                ...prev,
                isLoading: false,
                error: { code: 'paymentFailed' },
              }));
              return;
            }

            paymentDetails = { paymentMethodId: cardResult.paymentMethodId };
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
            setDonationState(prev => ({
              ...prev,
              isLoading: false,
              error: {
                code: paymentResponse.errorCode
                  ? (SUBMISSION_ERROR_CODES[
                      paymentResponse.errorCode as ServiceErrorCode
                    ] ?? 'paymentFailed')
                  : 'paymentFailed',
              },
            }));
            return;
          }

          if (paymentResponse.status === 'success') {
            const initialThankYouState = resolveThankYouState(
              paymentResponse,
              donationResponse
            );

            if (initialThankYouState?.status === 'bankTransferPending') {
              const thankYouState = await resolveThankYouStateFromDonation(
                donationResponse.donationId,
                token ?? undefined,
                initialThankYouState
              );
              setDonationState(prev => ({
                ...prev,
                isLoading: false,
                thankYouState,
              }));
              return;
            }

            if (initialThankYouState?.status === 'completed') {
              const thankYouState = await resolveThankYouStateFromDonation(
                donationResponse.donationId,
                token ?? undefined
              );
              setDonationState(prev => ({
                ...prev,
                isLoading: false,
                thankYouState,
              }));
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
                setDonationState(prev => ({
                  ...prev,
                  isLoading: false,
                  error: { code: 'paymentFailed' },
                }));
                return;
              }

              const confirmRequest: StripeCardActionConfirmRequest = {
                gateway: 'stripe',
                account: paymentResponse.response.account,
                source: {
                  id: actionResult.paymentIntentId,
                  object: 'payment_intent',
                },
              };
              const finalResponse = await paymentService.processPayment(
                donationResponse.donationId,
                confirmRequest,
                token || undefined,
                paymentAttemptKey
              );

              if (finalResponse.status === 'failed') {
                setDonationState(prev => ({
                  ...prev,
                  isLoading: false,
                  error: { code: 'paymentFailed' },
                }));
                return;
              }

              const thankYouState = await resolveThankYouStateFromDonation(
                donationResponse.donationId,
                token ?? undefined
              );
              setDonationState(prev => ({
                ...prev,
                isLoading: false,
                thankYouState,
              }));
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
                setDonationState(prev => ({
                  ...prev,
                  isLoading: false,
                  error: { code: 'paymentFailed' },
                }));
                return;
              }

              const thankYouState = await resolveThankYouStateFromDonation(
                donationResponse.donationId,
                token ?? undefined
              );
              setDonationState(prev => ({
                ...prev,
                isLoading: false,
                thankYouState,
              }));
              return;
            }

            if (values.selectedPaymentMethod === 'sepa_debit') {
              const sepaResult =
                (await sepaFormRef.current?.confirmSepaDebitPayment(
                  paymentResponse.response.payment_intent_client_secret
                )) ?? { error: 'No SEPA form available' };

              if (sepaResult.error) {
                setDonationState(prev => ({
                  ...prev,
                  isLoading: false,
                  error: { code: 'paymentFailed' },
                }));
              } else {
                const thankYouState = await resolveThankYouStateFromDonation(
                  donationResponse.donationId,
                  token ?? undefined
                );
                setDonationState(prev => ({
                  ...prev,
                  isLoading: false,
                  thankYouState,
                }));
              }
              return;
            }
          }

          setDonationState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        setDonationState(prev => ({
          ...prev,
          isLoading: false,
          error: toSubmitError(error),
        }));
      } finally {
        // Rotate keys once per completed submit attempt.
        donationKeyRef.current = generateIdempotencyKeyWithPrefix('donation');
        paymentKeyRef.current = generateIdempotencyKeyWithPrefix('payment');
        submittingRef.current = false;
      }
    },
    [
      donationData,
      fundraiser,
      paymentOptions,
      isAuthenticated,
      donorProfile,
      token,
      sepaFormRef,
      cardFormRef,
    ]
  );

  // TODO: PayPal callbacks share submittingRef, donationKeyRef, paymentKeyRef, and the other hook deps with onSubmit. When adding Stripe, consider extracting usePayPalFlow / useStripeFlow as internal composables that receive shared refs/state as arguments, keeping useDonationSubmit as the orchestrator.
  const onPayPalCreateOrder = useCallback(
    async (values: DonationFormValues): Promise<string> => {
      if (submittingRef.current)
        throw new Error('Submission already in progress');
      submittingRef.current = true;

      setDonationState(prev => ({
        ...prev,
        isLoading: true,
        thankYouState: null,
        error: null,
      }));

      const formData = assembleFormData(
        donationData,
        fundraiser,
        values,
        isAuthenticated
      );

      const { processingFeeCents: paypalProcessingFeeCents } =
        getDonationProcessingFeeInfo({
          paymentOptions,
          donationAmountCents: donationData.amountCents,
          donationCurrency: donationData.currency,
          workspaceCountry: fundraiser.workspace?.country,
          selectedPaymentMethod: values.selectedPaymentMethod,
        });

      const payload = buildDonationPayload(
        formData,
        fundraiser,
        donorProfile,
        values.selectedPaymentMethod,
        values.willAbsorbFee,
        paypalProcessingFeeCents
      );

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
        setDonationState(prev => ({ ...prev, isLoading: false }));
        submittingRef.current = false;
      }
    },
    [
      donationData,
      fundraiser,
      paymentOptions,
      isAuthenticated,
      donorProfile,
      token,
    ]
  );

  const onPayPalApproved = useCallback(
    async (data: OnApproveData): Promise<void> => {
      const donationId = paypalDonationIdRef.current;
      if (!donationId) {
        setDonationState(prev => ({
          ...prev,
          isLoading: false,
          error: { code: 'unexpected' },
        }));
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
          setDonationState(prev => ({
            ...prev,
            isLoading: false,
            error: {
              code: paymentResponse.errorCode
                ? (SUBMISSION_ERROR_CODES[
                    paymentResponse.errorCode as ServiceErrorCode
                  ] ?? 'paymentFailed')
                : 'paymentFailed',
            },
          }));
          return;
        }

        donationKeyRef.current = generateIdempotencyKeyWithPrefix('donation');
        paymentKeyRef.current = generateIdempotencyKeyWithPrefix('payment');

        const thankYouState = await resolveThankYouStateFromDonation(
          donationId,
          token ?? undefined
        );
        setDonationState(prev => ({
          ...prev,
          isLoading: false,
          thankYouState,
        }));
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
    [paymentOptions, token]
  );

  // TODO: API fetch is being refactored in a separate PR. When that lands,
  // adapt the donation/payment service calls below (submitStandardPostpaidDonation,
  // paymentService.processPayment) to the new client. Same applies to the card
  // and PayPal flows above.
  const onApplePayConfirm = useCallback(
    async (
      values: DonationFormValues,
      paymentMethodId: string,
      stripe: Stripe
    ): Promise<void> => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      setDonationState(prev => ({
        ...prev,
        isLoading: true,
        thankYouState: null,
        error: null,
      }));

      const formData = assembleFormData(
        donationData,
        fundraiser,
        values,
        isAuthenticated
      );

      const { processingFeeCents: applePayProcessingFeeCents } =
        getDonationProcessingFeeInfo({
          paymentOptions,
          donationAmountCents: donationData.amountCents,
          donationCurrency: donationData.currency,
          workspaceCountry: fundraiser.workspace?.country,
          selectedPaymentMethod: 'apple_pay',
        });

      const payload = buildDonationPayload(
        formData,
        fundraiser,
        donorProfile,
        'apple_pay',
        values.willAbsorbFee,
        applePayProcessingFeeCents
      );

      const donationAttemptKey = donationKeyRef.current;
      const paymentAttemptKey = paymentKeyRef.current;

      try {
        const { donationResponse, paymentResponse } =
          await submitStandardPostpaidDonation({
            payload,
            token: token || undefined,
            donationIdempotencyKey: donationAttemptKey,
            paymentIdempotencyKey: paymentAttemptKey,
            selectedPaymentMethod: 'apple_pay',
            paymentOptions,
            paymentDetails: { paymentMethodId },
          });

        if (paymentResponse.status === 'failed') {
          setDonationState(prev => ({
            ...prev,
            isLoading: false,
            error: {
              code: paymentResponse.errorCode
                ? (SUBMISSION_ERROR_CODES[
                    paymentResponse.errorCode as ServiceErrorCode
                  ] ?? 'paymentFailed')
                : 'paymentFailed',
            },
          }));
          return;
        }

        if (paymentResponse.status === 'success') {
          const thankYouState = await resolveThankYouStateFromDonation(
            donationResponse.donationId,
            token ?? undefined
          );
          setDonationState(prev => ({
            ...prev,
            isLoading: false,
            thankYouState,
          }));
          return;
        }

        if (paymentResponse.status === 'action_required') {
          if (paymentResponse.response.type === 'cardAction') {
            const { paymentIntent, error } = await stripe.handleCardAction(
              paymentResponse.response.payment_intent_client_secret
            );
            if (error || !paymentIntent) {
              setDonationState(prev => ({
                ...prev,
                isLoading: false,
                error: { code: 'paymentFailed' },
              }));
              return;
            }

            const confirmRequest: StripeCardActionConfirmRequest = {
              gateway: 'stripe',
              account: paymentResponse.response.account,
              source: { id: paymentIntent.id, object: 'payment_intent' },
            };
            const finalResponse = await paymentService.processPayment(
              donationResponse.donationId,
              confirmRequest,
              token || undefined,
              paymentAttemptKey
            );
            if (finalResponse.status === 'failed') {
              setDonationState(prev => ({
                ...prev,
                isLoading: false,
                error: { code: 'paymentFailed' },
              }));
              return;
            }
          } else if (paymentResponse.response.type === 'cardPayment') {
            const { error } = await stripe.confirmCardPayment(
              paymentResponse.response.payment_intent_client_secret,
              { payment_method: paymentResponse.response.payment_method }
            );
            if (error) {
              setDonationState(prev => ({
                ...prev,
                isLoading: false,
                error: { code: 'paymentFailed' },
              }));
              return;
            }
          }

          const thankYouState = await resolveThankYouStateFromDonation(
            donationResponse.donationId,
            token ?? undefined
          );
          setDonationState(prev => ({
            ...prev,
            isLoading: false,
            thankYouState,
          }));
        }
      } catch (error) {
        setDonationState(prev => ({
          ...prev,
          isLoading: false,
          error: toSubmitError(error),
        }));
      } finally {
        donationKeyRef.current = generateIdempotencyKeyWithPrefix('donation');
        paymentKeyRef.current = generateIdempotencyKeyWithPrefix('payment');
        submittingRef.current = false;
      }
    },
    [
      donationData,
      fundraiser,
      paymentOptions,
      isAuthenticated,
      donorProfile,
      token,
    ]
  );

  const onPayPalError = useCallback(() => {
    setDonationState(prev => ({
      ...prev,
      isLoading: false,
      error: { code: 'paypalPaymentError' },
    }));
    submittingRef.current = false;
  }, []);

  // Surfaces client-side Stripe.js failures from the Apple Pay flow
  // (elements.submit or createPaymentMethod). Server-side failures in the
  // donation/payment APIs are already handled inside onApplePayConfirm.
  const onApplePayError = useCallback(() => {
    setDonationState(prev => ({
      ...prev,
      isLoading: false,
      error: { code: 'paymentFailed' },
    }));
    submittingRef.current = false;
  }, []);

  const reset = useCallback(() => {
    setDonationState(INITIAL_DONATION_STATE);
    donationKeyRef.current = generateIdempotencyKeyWithPrefix('donation');
    paymentKeyRef.current = generateIdempotencyKeyWithPrefix('payment');
  }, []);

  return {
    donationState,
    onSubmit,
    onPayPalCreateOrder,
    onPayPalApproved,
    onPayPalError,
    onApplePayConfirm,
    onApplePayError,
    reset,
  };
}

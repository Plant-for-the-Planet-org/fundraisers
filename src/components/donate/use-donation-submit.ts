import type { OnApproveData } from '@paypal/paypal-js';
import type { DonationResponse } from '@/lib/types/donation';
import type {
  DonationSubmitError,
  DonationSubmitState,
  ThankYouState,
} from '@/lib/types/donation-submit';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentData } from '@/lib/types/payment';
import type { PaymentResponse } from '@/lib/types/payment';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { ServiceErrorCode } from '@/lib/types/submission-errors';
import type { DonationData } from './donate-overlay';
import type { DonationFormValues } from './donation-form-context';

import { useCallback, useRef, useState } from 'react';
import { DonationError, donationService } from '@/lib/api/donation-service';
import { PaymentError, paymentService } from '@/lib/api/payment-service';
import {
  createPaypalOrder,
  PaypalOrderError,
} from '@/lib/api/paypal-order-service';
import { submitStandardDonation } from '@/lib/donation/donation-submission';
import {
  assembleFormData,
  buildDonationPayload,
} from '@/lib/donation/payload-builder';
import { INITIAL_DONATION_STATE } from '@/lib/types/donation-submit';
import { SUBMISSION_ERROR_CODES } from '@/lib/types/submission-errors';
import { generateIdempotencyKeyWithPrefix } from '@/lib/utils/idempotency';
import {
  buildPaymentRequest,
  PaymentOptionsError,
} from '@/lib/utils/payment-request-builder';
import { useAuthStore } from '@/stores/auth-store';

function cleanPaymentDetails(
  details: PaymentData['paymentDetails']
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(details).filter(([_key, value]) => value !== undefined)
  ) as Record<string, string | number | boolean>;
}

/**
 * Maps a successful PaymentResponse to the appropriate ThankYouState,
 * or returns null for statuses that should keep the user in the flow.
 */
function resolveThankYouState(
  response: PaymentResponse,
  donationResponse: DonationResponse
): ThankYouState | null {
  const { donationId, uid, amount, currency, frequency } = donationResponse;
  switch (response.status) {
    case 'success':
      // Future: handle other success responses from different payment methods here
      if (response.response?.type === 'transfer_required') {
        return {
          status: 'bankTransferPending',
          donationId,
          uid,
          amount,
          currency,
          frequency,
          transferAccount: response.response.account,
        };
      }
      return { status: 'completed', donationId };

    case 'action_required':
      // Future: handle 3DS / card authentication
      return null;

    case 'failed':
      // Caller should handle this before calling resolveThankYouState,
      // but guard against it reaching here
      return null;

    default:
      console.warn('Received unrecognized payment response status:', response);
      return null;
  }
}

/** Maps a caught error to a UI-safe error with a translation key. */
function toSubmitError(error: unknown): DonationSubmitError {
  let serviceCode: string | undefined;

  if (
    error instanceof DonationError ||
    error instanceof PaymentError ||
    error instanceof PaymentOptionsError ||
    error instanceof PaypalOrderError
  ) {
    serviceCode = error.code;
  }

  const translationKey =
    serviceCode && serviceCode in SUBMISSION_ERROR_CODES
      ? SUBMISSION_ERROR_CODES[serviceCode as ServiceErrorCode]
      : 'unexpected';

  return { code: translationKey };
}

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
  paymentOptions: PaymentOptions
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

      const isPlanetCash =
        values.selectedPaymentMethod?.startsWith('pcash_') ?? false;

      const payload = buildDonationPayload(
        formData,
        fundraiser,
        donorProfile,
        isPlanetCash
      );

      // Future: Build payment details based on selected payment method
      const paymentDetails: PaymentData['paymentDetails'] = {};

      try {
        if (isPlanetCash) {
          // TODO: Implement PlanetCash donation flow
        } else {
          const { donationResponse, paymentResponse } =
            await submitStandardDonation({
              payload,
              token: token || undefined,
              donationIdempotencyKey: donationKeyRef.current,
              paymentIdempotencyKey: paymentKeyRef.current,
              selectedPaymentMethod: values.selectedPaymentMethod,
              paymentOptions,
              paymentDetails: cleanPaymentDetails(paymentDetails),
            });

          // Rotate keys now that the server accepted this operation
          donationKeyRef.current = generateIdempotencyKeyWithPrefix('donation');
          paymentKeyRef.current = generateIdempotencyKeyWithPrefix('payment');

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

          const thankYouState = resolveThankYouState(
            paymentResponse,
            donationResponse
          );

          if (thankYouState) {
            setDonationState(prev => ({
              ...prev,
              isLoading: false,
              thankYouState,
            }));
            return;
          }

          // `action_required` or unexpected status — keep user in flow.
          // Future: handle 3DS card authentication here.
          // NOTE: idempotency keys are intentionally NOT rotated here.
          // When implementing 3DS, the re-submission after user authentication should reuse the same keys (treating it as a confirmation of the same payment intent, not a new attempt). Verify this against the Stripe API contract before rotating.
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

      const isPlanetCash =
        values.selectedPaymentMethod?.startsWith('pcash_') ?? false;

      const payload = buildDonationPayload(
        formData,
        fundraiser,
        donorProfile,
        isPlanetCash
      );

      try {
        const donationResponse = await donationService.submitDonation(
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

        setDonationState(prev => ({
          ...prev,
          isLoading: false,
          thankYouState: { status: 'completed', donationId },
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

  const onPayPalError = useCallback(() => {
    setDonationState(prev => ({
      ...prev,
      isLoading: false,
      error: { code: 'paypalPaymentError' },
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
    reset,
  };
}

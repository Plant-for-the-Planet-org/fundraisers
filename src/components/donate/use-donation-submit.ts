// ===== Imports: Type-only =====
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { DonationFormValues } from './donation-form-context';
import type { DonationData } from './donate-overlay';
import type { PaymentData } from '@/lib/types/payment';
import type { ServiceErrorCode } from '@/lib/types/submission-errors';
import type { PaymentResponse } from '@/lib/types/payment';
import type {
  DonationSubmitError,
  DonationSubmitState,
  ThankYouState,
} from '@/lib/types/donation-submit';

import { useCallback, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { generateIdempotencyKeyWithPrefix } from '@/lib/utils/idempotency';
import {
  assembleFormData,
  buildDonationPayload,
} from '@/lib/donation/payload-builder';
import { submitStandardDonation } from '@/lib/donation/donation-submission';
import { DonationError } from '@/lib/api/donation-service';
import { PaymentError } from '@/lib/api/payment-service';
import { PaymentOptionsError } from '@/lib/utils/payment-request-builder';
import { SUBMISSION_ERROR_CODES } from '@/lib/types/submission-errors';
import { INITIAL_DONATION_STATE } from '@/lib/types/donation-submit';

function cleanPaymentDetails(
  details: PaymentData['paymentDetails']
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(details).filter(([_, value]) => value !== undefined)
  ) as Record<string, string | number | boolean>;
}

/**
 * Maps a successful PaymentResponse to the appropriate ThankYouState,
 * or returns null for statuses that should keep the user in the flow.
 */
function resolveThankYouState(
  response: PaymentResponse,
  donationId: string | null,
  uid: string | null
): ThankYouState | null {
  switch (response.status) {
    case 'success':
      if (response.response?.type === 'transfer_required') {
        return {
          status: 'bank_transfer_pending',
          donationId,
          uid,
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
  }
}

/** Maps a caught error to a UI-safe error with a translation key. */
function toSubmitError(error: unknown): DonationSubmitError {
  let serviceCode: string | undefined;

  if (
    error instanceof DonationError ||
    error instanceof PaymentError ||
    error instanceof PaymentOptionsError
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

  const [state, setState] = useState<DonationSubmitState>(
    INITIAL_DONATION_STATE
  );

  const submittingRef = useRef(false);
  // Stable idempotency keys across retries
  const donationKeyRef = useRef(generateIdempotencyKeyWithPrefix('donation'));
  const paymentKeyRef = useRef(generateIdempotencyKeyWithPrefix('payment'));

  const onSubmit = useCallback(
    async (values: DonationFormValues) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      setState(prev => ({
        ...prev,
        isLoading: true,
        thankYou: null,
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

      // Build payment details based on selected payment method
      const paymentDetails: PaymentData['paymentDetails'] = {};

      try {
        if (isPlanetCash) {
          // TODO: Implement PlanetCash donation flow
        } else {
          const { donationResponse, paymentResponse } =
            await submitStandardDonation(
              payload,
              token || undefined,
              donationKeyRef.current,
              paymentKeyRef.current,
              values.selectedPaymentMethod,
              paymentOptions,
              cleanPaymentDetails(paymentDetails)
            );

          // Rotate keys now that the server accepted this operation
          donationKeyRef.current = generateIdempotencyKeyWithPrefix('donation');
          paymentKeyRef.current = generateIdempotencyKeyWithPrefix('payment');

          if (paymentResponse.status === 'failed') {
            setState(prev => ({
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

          const thankYou = resolveThankYouState(
            paymentResponse,
            donationResponse.donationId ?? null,
            donationResponse.uid ?? null
          );

          if (thankYou) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              thankYou,
            }));
            return;
          }

          // `action_required` or unexpected status — keep user in flow
          // Future: handle 3DS card authentication here
          setState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        setState(prev => ({
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

  const reset = useCallback(() => {
    setState(INITIAL_DONATION_STATE);
    donationKeyRef.current = generateIdempotencyKeyWithPrefix('donation');
    paymentKeyRef.current = generateIdempotencyKeyWithPrefix('payment');
  }, []);

  return { state, onSubmit, reset };
}

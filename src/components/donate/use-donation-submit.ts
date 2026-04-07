import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { DonationFormValues } from './donation-form-context';
import type { DonationData } from './donate-overlay';
import type { PaymentData } from '@/lib/types/payment';
import type { ServiceErrorCode } from '@/lib/types/submission-errors';
import type {
  DonationSubmitError,
  DonationSubmitState,
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
    Object.entries(details).filter(([_key, value]) => value !== undefined)
  ) as Record<string, string | number | boolean>;
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

  const [donationState, setDonationState] = useState<DonationSubmitState>(
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

      // Reset stale success state on new submit
      setDonationState(prev => ({
        ...prev,
        isLoading: true,
        isSuccess: false,
        donationId: null,
        transferDetails: null,
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

          if (
            paymentResponse.status === 'success' &&
            paymentResponse.response?.type === 'transfer_required'
          ) {
            // For bank transfers, the payment is created but requires manual transfer
            // The UI should show transfer instructions to the user
            setDonationState(prev => ({
              ...prev,
              isLoading: false,
              isSuccess: true,
              donationId: donationResponse.donationId,
              transferDetails: paymentResponse.response,
            }));
            return;
          }

          // Success state for two-step flow
          setDonationState(prev => ({
            ...prev,
            isLoading: false,
            isSuccess: true,
            donationId: donationResponse.donationId,
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

  const reset = useCallback(() => {
    setDonationState(INITIAL_DONATION_STATE);
    donationKeyRef.current = generateIdempotencyKeyWithPrefix('donation');
    paymentKeyRef.current = generateIdempotencyKeyWithPrefix('payment');
  }, []);

  return { donationState, onSubmit, reset };
}

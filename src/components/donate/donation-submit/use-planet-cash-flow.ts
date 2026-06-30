import type { DonationFormValues } from '../donation-form-context';
import type { SubmissionCore } from './donation-submit-flow-types';

import { useCallback } from 'react';
import { submitPrepaidDonation } from '@/lib/donation/donation-submission';
import {
  beginSubmission,
  withError,
  withSubmitError,
} from '@/lib/donation/donation-submit-state';

/**
 * PlanetCash submission flow.
 *
 * Owns `onSubmit` for the prepaid single-POST path: the balance is deducted
 * immediately, so there is no separate payment (PUT) step, no Stripe payment
 * method, and no `action_required` handling. Authentication is required (the
 * balance belongs to the signed-in account), hence the `token` guard.
 *
 * Shares the same `submittingRef` guard and idempotency-key rotation as the
 * other flows via `core`, so concurrent submissions across gateways stay
 * mutually exclusive.
 */
export function usePlanetCashFlow(core: SubmissionCore) {
  const {
    setDonationState,
    submittingRef,
    donationKeyRef,
    rotateIdempotencyKeys,
    finalizeDonation,
    buildPayload,
    token,
  } = core;

  const onSubmit = useCallback(
    async (values: DonationFormValues) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      // Reset stale success state on new submit
      setDonationState(beginSubmission);

      const { payload } = buildPayload(values, values.selectedPaymentMethod);

      const donationAttemptKey = donationKeyRef.current;

      try {
        // PlanetCash: single POST, balance deducted immediately — no PUT step needed.
        if (!token) {
          setDonationState(withError('unexpected'));
          return;
        }
        const donationResponse = await submitPrepaidDonation(
          payload,
          token,
          donationAttemptKey
        );
        await finalizeDonation(donationResponse.donationId, token);
      } catch (error) {
        setDonationState(withSubmitError(error));
      } finally {
        // Rotate keys once per completed submit attempt.
        rotateIdempotencyKeys();
        submittingRef.current = false;
      }
    },
    [
      token,
      rotateIdempotencyKeys,
      finalizeDonation,
      buildPayload,
      submittingRef,
      setDonationState,
      donationKeyRef,
    ]
  );

  return { onSubmit };
}

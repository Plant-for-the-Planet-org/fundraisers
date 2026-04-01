import type { Fundraiser } from '@/lib/types/fundraiser';
import type { DonationFormValues } from './donation-form-context';
import type { DonationData } from './donate-overlay';
import type { DonationSubmitState } from '@/lib/donation/donation-submission';

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { generateIdempotencyKeyWithPrefix } from '@/lib/utils/idempotency';
import {
  assembleFormData,
  buildDonationPayload,
} from '@/lib/donation/payload-builder';
import {
  INITIAL_DONATION_STATE,
  submitStandardDonation,
} from '@/lib/donation/donation-submission';
import { DonationError } from '@/lib/api/donation-service';

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
  fundraiser: Fundraiser
) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const donorProfile = useAuthStore(state => state.user?.profile);
  const token = useAuthStore(state => state.accessToken);

  const [state, setState] = useState<DonationSubmitState>(
    INITIAL_DONATION_STATE
  );

  const onSubmit = useCallback(
    async (values: DonationFormValues) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

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

      // Idempotency keys ensure retries for the same logical operation are deduplicated
      const donationIdempotencyKey =
        generateIdempotencyKeyWithPrefix('donation');

      try {
        if (isPlanetCash) {
          // TODO: Implement PlanetCash donation flow
        } else {
          await submitStandardDonation(
            payload,
            token || undefined,
            donationIdempotencyKey
          );
          // TODO - clear isLoading state after successful donation submission.
        }
      } catch (error) {
        console.error('Donation submission error:', error);

        let errorCode = 'UNEXPECTED';
        let errorValues: Record<string, string | number> | undefined;

        if (error instanceof DonationError) {
          errorCode = error.code;
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: { code: errorCode, values: errorValues },
        }));
      }
    },
    [donationData, fundraiser, isAuthenticated, donorProfile, token]
  );

  const reset = useCallback(() => {
    setState(INITIAL_DONATION_STATE);
  }, []);

  return { state, onSubmit, reset };
}

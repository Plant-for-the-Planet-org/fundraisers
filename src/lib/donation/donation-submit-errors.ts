import type { DonationSubmitError } from '@/lib/types/donation-submit';
import type { ServiceErrorCode } from '@/lib/types/submission-errors';

import { DonationError } from '@/lib/api/donation-service';
import { PaymentError } from '@/lib/api/payment-service';
import { PaypalOrderError } from '@/lib/api/paypal-order-service';
import { SUBMISSION_ERROR_CODES } from '@/lib/types/submission-errors';
import { PaymentOptionsError } from '@/lib/utils/payment-request-builder';
import { toDonationFieldErrors } from './donation-field-errors';

/** Maps a caught error to a UI-safe error with a translation key. */
export function toSubmitError(error: unknown): DonationSubmitError {
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

  // Only donation creation reports field errors today. The banner still shows
  // alongside them, and stays the sole feedback when none of them map.
  const fieldErrors =
    error instanceof DonationError
      ? toDonationFieldErrors(error.fieldErrors)
      : undefined;

  return { code: translationKey, fieldErrors };
}

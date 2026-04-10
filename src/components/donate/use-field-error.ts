import type { DonationFormErrorKey } from '@/lib/types/donation-form-errors';

import { useTranslations } from 'next-intl';
import { DONATION_FORM_ERRORS } from '@/lib/types/donation-form-errors';

export function useFieldError() {
  const tDonate = useTranslations('Donate.errors');

  return function translateError(
    message: string | undefined
  ): string | undefined {
    if (!message) return undefined;
    if (message in DONATION_FORM_ERRORS) {
      return tDonate(message as DonationFormErrorKey);
    }
    // Zod's built-in messages (e.g. from .min() with no custom message) fall through as-is
    return message;
  };
}

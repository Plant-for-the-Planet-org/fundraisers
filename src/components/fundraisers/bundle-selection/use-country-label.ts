'use client';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { getCountry } from '@/lib/utils/country';

/**
 * Returns a function that maps an ISO 3166-1 alpha-2 country code to its
 * localized display name via the shared `getCountry` helper. Falls back to the
 * normalized input when the code is missing, malformed, or unknown so the
 * caller can still render something useful.
 */
export function useCountryLabel(): (code: string) => string {
  const locale = useLocale();

  return useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return '';
      if (!/^[A-Z]{2}$/.test(normalized)) return normalized;
      return getCountry(normalized, locale);
    },
    [locale]
  );
}

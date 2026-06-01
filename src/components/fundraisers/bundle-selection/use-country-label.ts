'use client';

import { useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';

/**
 * Returns a function that maps an ISO 3166-1 alpha-2 country code to its
 * localized display name (via `Intl.DisplayNames`). Falls back to the
 * normalized input when the code is missing, malformed, or unknown so the
 * caller can still render something useful.
 */
export function useCountryLabel(): (code: string) => string {
  const locale = useLocale();
  const countryDisplayNames = useMemo(
    () => new Intl.DisplayNames([locale], { type: 'region' }),
    [locale]
  );

  return useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return '';
      if (!/^[A-Z]{2}$/.test(normalized)) return normalized;
      return countryDisplayNames.of(normalized) ?? normalized;
    },
    [countryDisplayNames]
  );
}

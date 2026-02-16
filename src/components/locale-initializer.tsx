'use client';

import { useEffect } from 'react';
import { useLocaleStore } from '@/stores/localeStore';

export function LocaleInitializer({
  initialLocale,
}: {
  initialLocale: string;
}) {
  useEffect(() => {
    const currentLocale = useLocaleStore.getState().locale;

    // Sync server locale with store if different
    if (initialLocale !== currentLocale) {
      // Update store without triggering reload
      useLocaleStore.setState({ locale: initialLocale });
    }
  }, [initialLocale]);

  return null;
}

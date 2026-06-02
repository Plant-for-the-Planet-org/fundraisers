import { cache } from 'react';

const getLocaleStore = cache(() => ({ locale: 'de' }));

export function setRequestLocale(locale: string) {
  getLocaleStore().locale = locale;
}

export function getRequestLocale(): string {
  return getLocaleStore().locale;
}

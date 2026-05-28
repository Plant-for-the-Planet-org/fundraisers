let currentRequestLocale = 'en';

export function setRequestLocale(locale: string) {
  currentRequestLocale = locale;
}

export function getRequestLocale(): string {
  return currentRequestLocale;
}

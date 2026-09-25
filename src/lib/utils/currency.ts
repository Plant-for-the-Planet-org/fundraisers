/**
 * Currency formatting utilities
 */

import { formatCompactNumber, formatLocalizedNumber } from './formatting';

// Map of major currencies to their symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RUB: '₽',
  INR: '₹',
  BRL: 'R$',
  MXN: 'MX$',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  ZAR: 'R',
  TRY: '₺',
  ILS: '₪',
  THB: '฿',
};

interface FormatCurrencyOptions {
  compact?: boolean;
}

interface FormatCurrencyFromDecimalOptions extends FormatCurrencyOptions {
  currencyDisplay?: 'symbol' | 'code';
}

/** Format a number with the given locale, respecting compact mode. */
function formatAmount(value: number, locale: string, compact: boolean): string {
  return compact
    ? formatCompactNumber(value, locale)
    : formatLocalizedNumber(value, locale);
}

const NO_BREAK_SPACE = '\u00a0';

interface CurrencyLayout {
  currencyFirst: boolean;
  gap: string;
  minusSign: string;
  minusBeforeCurrency: boolean;
}

const layoutCache = new Map<string, CurrencyLayout>();

/**
 * Learn from Intl where the locale puts the currency, what sits between it and the number, and where the minus sign goes.
 * The probe is EUR because its narrow symbol "€" is not a letter, so Intl adds no spacing of its own and any gap comes from the locale pattern ("50 €" in German).
 */
function getCurrencyLayout(locale: string): CurrencyLayout {
  const cached = layoutCache.get(locale);
  if (cached) return cached;

  const probe = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    currencyDisplay: 'narrowSymbol',
  });
  const positive = probe.formatToParts(1);
  const negative = probe.formatToParts(-1);
  const currencyAt = positive.findIndex(p => p.type === 'currency');
  const integerAt = positive.findIndex(p => p.type === 'integer');
  const currencyFirst = currencyAt < integerAt;
  const between = currencyFirst
    ? positive.slice(currencyAt + 1, integerAt)
    : positive.slice(integerAt + 1, currencyAt);
  const minusAt = negative.findIndex(p => p.type === 'minusSign');

  const layout: CurrencyLayout = {
    currencyFirst,
    gap: between
      .filter(p => p.type === 'literal')
      .map(p => p.value)
      .join(''),
    minusSign: negative[minusAt]?.value ?? '-',
    minusBeforeCurrency:
      minusAt < negative.findIndex(p => p.type === 'currency'),
  };
  layoutCache.set(locale, layout);
  return layout;
}

/** Place the currency label (the app's symbol or the ISO code) where the locale puts the currency. */
function attachCurrency(
  formattedAmount: string,
  label: string,
  locale: string
): string {
  const { currencyFirst, gap, minusSign, minusBeforeCurrency } =
    getCurrencyLayout(locale || 'en');

  // Same rule Intl follows: a label that touches the number with a letter ("CHF", "kr") gets a space, a sign like "€" or "$" does not.
  const edge = currencyFirst ? label[label.length - 1] : label[0];
  const space = gap || (/\p{L}/u.test(edge ?? '') ? NO_BREAK_SPACE : '');

  if (!currencyFirst) return `${formattedAmount}${space}${label}`;
  if (minusBeforeCurrency && formattedAmount.startsWith(minusSign)) {
    const unsigned = formattedAmount.slice(minusSign.length);
    return `${minusSign}${label}${space}${unsigned}`;
  }
  return `${label}${space}${formattedAmount}`;
}

/**
 * Format currency amount from cents with appropriate symbol or code.
 *
 * Locale must be supplied by the caller (next-intl `useLocale()` / `getLocale()`).
 * The locale decides where the symbol goes: "€1,234.50" in English, "1.234,50 €" in German.
 * Exact notation by default; pass { compact: true } for abbreviated display from a million up (e.g. €1.20 M, or 1,20 Mio. € in German).
 *
 * @param amountInCents - The amount in cents from API (e.g., 1234 = $12.34)
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @param locale - Active locale (e.g. 'de', 'en')
 * @param options - Optional: compact toggle
 */
export function formatCurrency(
  amountInCents: number,
  currency: string | null | undefined,
  locale: string,
  options?: FormatCurrencyOptions
): string {
  const compact = options?.compact ?? false;
  const amount = amountInCents / 100;
  const formattedAmount = formatAmount(amount, locale, compact);
  const currencyUpper = currency?.toUpperCase();
  if (!currencyUpper) return formattedAmount;
  return attachCurrency(
    formattedAmount,
    CURRENCY_SYMBOLS[currencyUpper] ?? currencyUpper,
    locale
  );
}

/**
 * Format currency amount from decimal value.
 *
 * Locale must be supplied by the caller (next-intl `useLocale()` / `getLocale()`).
 * The locale decides where the symbol or code goes: "€50" and "EUR 50" in English, "50 €" and "50 EUR" in German.
 * Exact notation by default; pass { compact: true } for abbreviated display from a million up (e.g. €1.20 M, or 1,20 Mio. € in German).
 *
 * @param amount - The amount in major currency units (e.g., 12.34 for $12.34)
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @param locale - Active locale (e.g. 'de', 'en')
 * @param options - Optional: currencyDisplay, compact toggle
 */
export function formatCurrencyFromDecimal(
  amount: number,
  currency: string | null | undefined,
  locale: string,
  options?: FormatCurrencyFromDecimalOptions
): string {
  const compact = options?.compact ?? false;
  const currencyDisplay = options?.currencyDisplay ?? 'symbol';
  const formattedAmount = formatAmount(amount, locale, compact);

  // No currency set yet (e.g. a draft): show the bare amount rather than crash.
  const currencyUpper = currency?.toUpperCase();
  if (!currencyUpper) return formattedAmount;

  const label =
    currencyDisplay === 'code'
      ? currencyUpper
      : (CURRENCY_SYMBOLS[currencyUpper] ?? currencyUpper);
  return attachCurrency(formattedAmount, label, locale);
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string | null | undefined): string {
  if (!currency) return '';
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
}

/**
 * Check if a currency has a dedicated symbol
 */
export function hasCurrencySymbol(
  currency: string | null | undefined
): boolean {
  if (!currency) return false;
  return currency.toUpperCase() in CURRENCY_SYMBOLS;
}

/**
 * Convert array of currency amounts (in cents) with API-provided exchange rates to target currency
 * Uses the exchange rates provided by the API for accurate conversion
 *
 * @param amounts - Array of {currency, amountInCents, exchangeRate} objects from API
 * @param targetCurrency - Target currency code
 * @returns Total amount in target currency cents
 */
export function convertMultiCurrencyTotal(
  amounts: Array<{ currency: string; amount: number; exchangeRate: number }>,
  targetCurrency: string
): number {
  // Validate input parameters
  if (!amounts || !Array.isArray(amounts)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('convertMultiCurrencyTotal: amounts must be an array');
    }
    return 0;
  }

  if (!targetCurrency || typeof targetCurrency !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'convertMultiCurrencyTotal: targetCurrency must be a string'
      );
    }
    return 0;
  }

  let totalInTargetCurrencyCents = 0;

  for (const item of amounts) {
    // Validate each amount item
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.currency !== 'string' ||
      typeof item.amount !== 'number' ||
      typeof item.exchangeRate !== 'number'
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('convertMultiCurrencyTotal: invalid amount item', item);
      }
      continue;
    }

    const { currency, amount, exchangeRate } = item;

    if (currency.toUpperCase() === targetCurrency.toUpperCase()) {
      // Same currency, add directly (amount is already in cents)
      totalInTargetCurrencyCents += amount;
    } else {
      // Convert using API-provided exchange rate (amount is in cents)
      totalInTargetCurrencyCents += amount * exchangeRate;
    }
  }

  return Math.round(totalInTargetCurrencyCents);
}

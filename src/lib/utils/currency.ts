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

/** Attach the currency symbol (or code) to a formatted number string. */
function attachSymbol(formattedAmount: string, currencyUpper: string): string {
  const symbol = CURRENCY_SYMBOLS[currencyUpper];

  if (symbol) {
    const symbolAfter = ['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF'].includes(
      currencyUpper
    );
    return symbolAfter
      ? `${formattedAmount} ${symbol}`
      : `${symbol}${formattedAmount}`;
  }

  return `${formattedAmount} ${currencyUpper}`;
}

/**
 * Format currency amount from cents with appropriate symbol or code.
 *
 * Locale must be supplied by the caller (next-intl `useLocale()` /
 * `getLocale()`). Exact notation by default; pass { compact: true } for
 * abbreviated display (e.g. $12.30 K, or 12,30 Tsd. in German).
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
  return attachSymbol(formattedAmount, currencyUpper);
}

/**
 * Format currency amount from decimal value.
 *
 * Locale must be supplied by the caller (next-intl `useLocale()` /
 * `getLocale()`). Exact notation by default; pass { compact: true } for
 * abbreviated display (e.g. €18.70 K, or 18,70 Tsd. in German).
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

  if (currencyDisplay === 'code') {
    return `${currencyUpper} ${formattedAmount}`;
  }

  return attachSymbol(formattedAmount, currencyUpper);
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

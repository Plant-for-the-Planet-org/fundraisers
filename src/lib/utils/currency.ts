/**
 * Currency formatting utilities
 */

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

/**
 * Format currency amount from cents with appropriate symbol or code
 * For major currencies, uses symbols (e.g., $, €, £)
 * For others, uses 3-character currency code
 *
 * @param amountInCents - The amount in cents from API (e.g., 1234 = $12.34)
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @param locale - The locale for number formatting (defaults to 'en-US')
 */
export function formatCurrency(
  amountInCents: number,
  currency: string,
  locale: string = 'en-US',
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const currencyUpper = currency.toUpperCase();

  // Convert cents to major currency unit (divide by 100)
  const amount = amountInCents / 100;

  const minimumFractionDigits = options?.minimumFractionDigits ?? 0;
  const maximumFractionDigits = options?.maximumFractionDigits ?? 2;

  // Format the number with locale-specific decimal and thousands separators
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  // Use symbol if available, otherwise use currency code
  const symbol = CURRENCY_SYMBOLS[currencyUpper];

  if (symbol) {
    // For most currencies, symbol goes before the amount
    // Special cases where symbol goes after
    const symbolAfter = ['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF'].includes(
      currencyUpper
    );

    if (symbolAfter) {
      return `${formattedAmount} ${symbol}`;
    } else {
      return `${symbol}${formattedAmount}`;
    }
  } else {
    // Fallback to currency code for unsupported currencies
    return `${formattedAmount} ${currencyUpper}`;
  }
}

/**
 * Format currency amount from decimal value (for backward compatibility with old data)
 *
 * @param amount - The amount in major currency units (e.g., 12.34 for $12.34)
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @param locale - The locale for number formatting (defaults to 'en-US')
 */
export function formatCurrencyFromDecimal(
  amount: number,
  currency: string,
  locale: string = 'en-US',
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const currencyUpper = currency.toUpperCase();

  const minimumFractionDigits = options?.minimumFractionDigits ?? 0;
  const maximumFractionDigits = options?.maximumFractionDigits ?? 2;

  // Format the number with locale-specific decimal and thousands separators
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

  // Use symbol if available, otherwise use currency code
  const symbol = CURRENCY_SYMBOLS[currencyUpper];

  if (symbol) {
    // For most currencies, symbol goes before the amount
    // Special cases where symbol goes after
    const symbolAfter = ['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF'].includes(
      currencyUpper
    );

    if (symbolAfter) {
      return `${formattedAmount} ${symbol}`;
    } else {
      return `${symbol}${formattedAmount}`;
    }
  } else {
    // Fallback to currency code for unsupported currencies
    return `${formattedAmount} ${currencyUpper}`;
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
}

/**
 * Check if a currency has a dedicated symbol
 */
export function hasCurrencySymbol(currency: string): boolean {
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

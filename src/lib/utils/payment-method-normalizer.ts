import type { PaymentMethodId } from '@/lib/types/payment-methods';

/**
 * Lower-case + trim a token from the API. Exists to absorb casing/whitespace
 * variants (e.g. `'Stripe '`, `'OFFLINE'`) before comparison.
 *
 * NOTE: deliberately does NOT convert underscores to dashes — internal ids
 * are snake_case to match the platform API and Stripe SDK.
 */
export function normalizePaymentToken(value: string): string {
  return value.toLowerCase().trim();
}

const METHOD_ID_ALIASES: Record<PaymentMethodId, readonly string[]> = {
  card: ['card', 'credit-card', 'debit-card'],
  sepa_debit: ['sepa', 'sepa_debit', 'sepa-debit'],
  paypal: ['paypal'],
  bank_transfer: ['bank_transfer', 'bank-transfer', 'offline'],
  apple_pay: ['apple_pay', 'applepay', 'apple-pay'],
  google_pay: ['google_pay', 'googlepay', 'google-pay'],
  planet_cash: ['planet_cash', 'planet-cash', 'planetcash'],
};

const ALIAS_LOOKUP: Readonly<Record<string, PaymentMethodId>> = Object.entries(
  METHOD_ID_ALIASES
).reduce<Record<string, PaymentMethodId>>((lookup, [id, aliasArray]) => {
  for (const alias of aliasArray) {
    lookup[alias] = id as PaymentMethodId;
  }
  return lookup;
}, {});

/**
 * Map a method id from any source (API, legacy data, gateway fallback) to
 * the canonical snake_case `PaymentMethodId`. Returns `null` for unknown ids.
 */
export function normalizePaymentMethodId(
  methodId: string | null | undefined
): PaymentMethodId | null {
  if (!methodId) return null;
  return ALIAS_LOOKUP[normalizePaymentToken(methodId)] ?? null;
}

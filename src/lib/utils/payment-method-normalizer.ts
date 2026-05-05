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

/**
 * Map a method id from any source (API, legacy data, gateway fallback) to
 * the canonical snake_case `PaymentMethodId`. Returns `null` for unknown ids.
 *
 * Aliases handled:
 * - `'sepa'` → `'sepa_debit'`
 * - `'credit-card'` / `'debit-card'` → `'card'`
 * - `'offline'` → `'bank_transfer'` (gateway name vs. method name)
 * - `'applepay'` / `'googlepay'` → `'apple_pay'` / `'google_pay'`
 */
export function normalizePaymentMethodId(
  methodId: string | null | undefined
): PaymentMethodId | null {
  if (!methodId) {
    return null;
  }

  const normalized = normalizePaymentToken(methodId);

  if (
    normalized === 'card' ||
    normalized === 'credit-card' ||
    normalized === 'debit-card'
  ) {
    return 'card';
  }
  if (normalized === 'sepa' || normalized === 'sepa_debit') {
    return 'sepa_debit';
  }
  if (normalized === 'paypal') {
    return 'paypal';
  }
  if (normalized === 'bank_transfer' || normalized === 'offline') {
    return 'bank_transfer';
  }
  if (normalized === 'apple_pay' || normalized === 'applepay') {
    return 'apple_pay';
  }
  if (normalized === 'google_pay' || normalized === 'googlepay') {
    return 'google_pay';
  }

  return null;
}

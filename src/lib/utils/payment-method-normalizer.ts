import type { PaymentMethodId } from '@/lib/types/payment-methods';

export function normalizePaymentToken(value: string): string {
  return value.toLowerCase().trim().replaceAll('_', '-');
}

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
  if (normalized === 'sepa' || normalized === 'sepa-debit') {
    return 'sepa-debit';
  }
  if (normalized === 'paypal') {
    return 'paypal';
  }
  if (normalized === 'bank-transfer' || normalized === 'offline') {
    return 'bank-transfer';
  }
  if (normalized === 'apple-pay' || normalized === 'applepay') {
    return 'apple-pay';
  }
  if (normalized === 'google-pay' || normalized === 'googlepay') {
    return 'google-pay';
  }

  return null;
}

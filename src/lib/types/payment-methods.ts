// Internal payment method ids — kept in snake_case to match the
// platform API (`gateways.<g>.methods[]`, `lastPaymentMethod`) and the
// Stripe SDK (`PaymentMethodCreateParams.type`). Avoids round-tripping
// through case conversion at the boundary.
export type PaymentMethodId =
  | 'bank_transfer'
  | 'paypal'
  | 'card'
  | 'sepa_debit'
  | 'apple_pay'
  | 'google_pay'
  | 'planet_cash';

export type PaymentMethodProvider =
  | 'stripe'
  | 'paypal'
  | 'offline'
  | 'planetcash';

export const SUPPORTED_METHOD_IDS: ReadonlySet<PaymentMethodId> = new Set([
  'bank_transfer',
  'paypal',
  'card',
  'sepa_debit',
  'apple_pay',
  'planet_cash',
]);

export type FeeRegion = 'US' | 'EU' | 'ROW';

interface BaseDerivedPaymentMethod {
  id: PaymentMethodId;
  provider: PaymentMethodProvider;
}

export type DerivedPaymentMethod =
  | (BaseDerivedPaymentMethod & { hasFee: false })
  | (BaseDerivedPaymentMethod & {
      hasFee: true;
      feeAmountCents: number;
      feeRegion: FeeRegion;
    });

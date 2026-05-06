export type PaymentMethodId =
  | 'bank-transfer'
  | 'paypal'
  | 'card'
  | 'sepa-debit'
  | 'apple-pay'
  | 'google-pay';

export type PaymentMethodProvider =
  | 'stripe'
  | 'paypal'
  | 'offline'
  | 'planetcash';

export const SUPPORTED_METHOD_IDS: ReadonlySet<PaymentMethodId> = new Set([
  'bank-transfer',
  'paypal',
  'card',
  'sepa-debit',
  'apple-pay',
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

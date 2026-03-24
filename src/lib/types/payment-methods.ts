export type PaymentMethodId =
  | 'open-banking'
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
  | 'open-banking'
  | 'planetcash';

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

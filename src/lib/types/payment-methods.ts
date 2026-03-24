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

export interface DerivedPaymentMethod {
  id: PaymentMethodId;
  provider: PaymentMethodProvider;
  labelKey: string;
  disabled: boolean;
  hasFee: boolean;
  feeAmountCents: number;
  feeRegion: FeeRegion;
}

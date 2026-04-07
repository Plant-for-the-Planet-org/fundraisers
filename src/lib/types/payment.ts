// Payment methods available
export type PaymentMethod =
  | 'card'
  | 'sepa-debit'
  | 'apple-pay'
  | 'google-pay'
  | 'paypal'
  | 'bank-transfer';

// Payment providers supported by the platform
export type PaymentProvider = 'stripe' | 'paypal' | 'offline' | 'planet-cash';

export interface PaymentData {
  donationId: string;
  paymentMethod: PaymentMethod;
  paymentDetails: {
    savedMethodId?: string; // For saved payment methods
    paymentMethodId?: string; // Stripe payment method ID for new payments
    sourceId?: string; // Alternative field name for payment method ID
    account?: string; // Account ID for the payment gateway
    orderId?: string; // PayPal order ID from PayPal SDK
    orderID?: string; // Alternative field name for PayPal order ID
    [key: string]: string | number | boolean | undefined;
  };
}

export interface StripePaymentSource {
  kind: 'stripe';
  id: string;
  object: 'payment_method';
}

export interface PayPalPaymentSource {
  type: 'server_order';
  orderId: string;
}

export type OfflinePaymentSource = Record<string, never>;

// Discriminated union on `kind` — each branch is unambiguous
export type PaymentSource =
  | StripePaymentSource
  | PayPalPaymentSource
  | OfflinePaymentSource;

// Payment request structure sent to API
export interface PaymentRequest {
  account: string;
  gateway: PaymentProvider;
  method: string;
  source: PaymentSource;
  savedMethod?: string; // For saved payment methods
}
// Payment response from API
export interface PaymentResponse {
  id: string;
  status: 'success' | 'pending' | 'failed';
  // Bank transfer fields (offline)
  response: {
    type: 'transfer_required';
    account: {
      beneficiary: string;
      iban: string;
      bic: string;
      bankName: string;
    };
  };
}

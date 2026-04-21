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

interface PaymentDataBase {
  donationId: string;
  paymentMethod: PaymentMethod;
}

export interface OfflinePaymentData extends PaymentDataBase {
  paymentMethod: 'bank-transfer';
  paymentDetails: Record<string, never>;
}

// TODO: discriminate Stripe and PayPal variants when implementing those payment flows
export interface StripeOrPaypalPaymentData extends PaymentDataBase {
  paymentMethod: Exclude<PaymentMethod, 'bank-transfer'>;
  paymentDetails: {
    savedMethodId?: string;
    paymentMethodId?: string;
    sourceId?: string; // Alternative field name for paymentMethodId
    account?: string;
    orderId?: string;
    orderID?: string; // Alternative field name for orderId
    [key: string]: string | number | boolean | undefined;
  };
}

export type PaymentData = OfflinePaymentData | StripeOrPaypalPaymentData;

export interface StripePaymentSource {
  id: string;
  object: 'payment_method';
}

export interface PayPalPaymentSource {
  type: 'server_order';
  orderID: string;
  payerID: string;
  paymentID: string;
  billingToken: string | null;
  facilitatorAccessToken: string;
  paymentSource: string;
}

export type OfflinePaymentSource = Record<string, never>;

export type PaymentSource =
  | StripePaymentSource
  | PayPalPaymentSource
  | OfflinePaymentSource;

export type StripePaymentMethod =
  | 'card'
  | 'sepa_debit'
  | 'apple_pay'
  | 'google_pay';

// Payment request structure sent to API — discriminated union on `gateway`
interface StripePaymentRequest {
  gateway: 'stripe';
  account: string;
  method: StripePaymentMethod;
  source: StripePaymentSource;
  savedMethod?: string; // TODO: confirm saved payment method structure with backend
}

// Second PUT after a cardAction 3DS challenge — no method field, source is a payment_intent
export interface StripeCardActionConfirmRequest {
  gateway: 'stripe';
  account: string;
  source: {
    id: string;
    object: 'payment_intent';
  };
}

interface PayPalPaymentRequest {
  gateway: 'paypal';
  account: string;
  method: 'paypal';
  source: PayPalPaymentSource;
}

interface OfflinePaymentRequest {
  gateway: 'offline';
  account: string;
  method: 'offline';
  source: OfflinePaymentSource;
}

export type PaymentRequest =
  | StripePaymentRequest
  | StripeCardActionConfirmRequest
  | PayPalPaymentRequest
  | OfflinePaymentRequest;

// Payment response from API
interface PaymentResponseBase {
  id: string;
  status: 'success' | 'action_required' | 'failed';
}

export interface BankAccountDetails {
  beneficiary: string;
  iban: string;
  bic: string;
  bankName: string;
}

interface PaymentResponseSuccess extends PaymentResponseBase {
  status: 'success';
  response?: {
    type: 'transfer_required';
    account: BankAccountDetails;
  };
}

type PaymentResponseActionRequired =
  | {
      id: string;
      status: 'action_required';
      response: {
        type: 'cardAction';
        requires_action: true;
        payment_intent_client_secret: string;
        account: string;
      };
    }
  | {
      id: string;
      status: 'action_required';
      response: {
        type: 'cardPayment';
        requires_action: true;
        payment_intent_client_secret: string;
        account: string;
        payment_method: string; // required here
      };
    };

interface PaymentResponseFailed extends PaymentResponseBase {
  status: 'failed';
  errorCode: string | null;
  message: string;
}

export type PaymentResponse =
  | PaymentResponseSuccess
  | PaymentResponseActionRequired
  | PaymentResponseFailed;

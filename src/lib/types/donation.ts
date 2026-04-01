export interface DonationResponse {
  success: boolean;
  donationId?: string;
  message?: string;
  errors?: Record<string, string>;
}

export interface PaymentData {
  donationId: string;
  paymentMethod: 'card' | 'sepa-debit' | 'paypal' | 'bank-transfer' | string;
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

export interface LineItem {
  project: string;
  amount: number; // in full currency units
}

export interface LineItemCalculationResult {
  lineItems: LineItem[];
  totalAmount: number; // in full currency units
  totalPercentage: number;
}

export interface DonorInfo {
  firstname: string;
  lastname: string;
  email: string;
  address?: string;
  address2?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  country?: string;
  companyname?: string;
}

export interface CustomFieldValue {
  label: string;
  key: string;
  type: 'text' | 'textarea' | 'dropdown' | 'number' | 'checkbox';
  value: string | number | boolean;
}

export interface DonationMetadata {
  utm_campaign: string; // fundraiser ID
  fundraiser: {
    id: string;
    source: string;
    referrer?: string;
    user_id?: string;
    privacy: {
      is_anonymous: boolean;
    };
    customFields?: CustomFieldValue[];
  };
}

/** Intermediate form data assembled from donation context and user input */
interface DonationFormDataBase {
  amount: number;
  currency: string;
  frequency: string;
  isAnonymous: boolean;
}

export interface AuthenticatedFormData extends DonationFormDataBase {
  type: 'authenticated';
  receiptAddress: string;
}

export interface GuestFormData extends DonationFormDataBase {
  type: 'guest';
  companyName?: string;
  donor: {
    firstname: string;
    lastname: string;
    email: string;
    address: string;
    address2?: string;
    zipCode: string;
    city: string;
    state?: string;
    country: string;
  };
}

export type DonationFormData = AuthenticatedFormData | GuestFormData;

interface DonationPayloadBase {
  currency: string;
  frequency: string;
  lineItems: LineItem[];
  donorAlias?: string;
  metadata: DonationMetadata;
  prePaid?: boolean;
}

export interface AuthenticatedDonationPayload extends DonationPayloadBase {
  receiptAddress: string;
  donor?: never;
}

export interface GuestDonationPayload extends DonationPayloadBase {
  donor: DonorInfo;
  receiptAddress?: never;
}

export type DonationPayload =
  | AuthenticatedDonationPayload
  | GuestDonationPayload;

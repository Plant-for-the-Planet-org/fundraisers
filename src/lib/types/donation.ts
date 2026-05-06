import type { SentInvitationGift } from '@planet-sdk/common';
import type { BankAccountDetails } from './payment';

// TODO: evaluate if the DonationResponse interface is accurate
export interface DonationResponse {
  success: boolean;
  donationId: string;
  uid: string;
  amount: number; // decimal, e.g. 2.5 for €2.50
  currency: string;
  frequency: DonationFrequency;
  message?: string;
  errors?: Record<string, string>;
}

// Confirmed with backend. Practically: 'pending', 'initiated', 'paid'.
// Terminal non-paid statuses are unlikely after a successful PUT but enumerated for completeness.
// 'draft' is never returned once a payment exists.
export type DonationPaymentStatus =
  | 'pending'
  | 'initiated'
  | 'paid'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'referred'
  | 'in-dispute'
  | 'dispute-lost';

export interface DonationStatusResponse {
  id: string;
  gateway: string;
  paymentStatus: DonationPaymentStatus;
  paymentDate: string | null; // null while pending, populated once settled
  uid: string;
  amount: number;
  currency: string;
  frequency: string | null;
  account?: BankAccountDetails; // present for offline (bank transfer) donations
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
  tin: string | null;
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
    source?: string;
    referrer?: string;
    user_id?: string;
    privacy: {
      is_anonymous: boolean;
    };
    customFields?: CustomFieldValue[];
  };
  fees?: {
    is_fee_absorbed: boolean;
    fee_amount: number; // decimal
  };
}

/** Intermediate form data assembled from donation context and user input */
interface DonationFormDataBase {
  amountCents: number;
  currency: string;
  frequency: DonationFrequency;
  isAnonymous: boolean;
  tin?: string;
  gift?: SentInvitationGift;
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

export type DonationFrequency = 'once' | 'monthly' | 'yearly';

export interface DonationPayload {
  amount: number; // base donation total excluding fees, decimal
  currency: string;
  frequency: DonationFrequency;
  lineItems: LineItem[];
  donorAlias?: string;
  metadata: DonationMetadata;
  absorbedFee?: number; // processing fee covered by donor, decimal
  prePaid?: boolean;
  donor: DonorInfo;
  gift?: SentInvitationGift;
}

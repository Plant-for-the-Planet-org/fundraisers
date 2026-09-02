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

/**
 * Campaign the donor arrived on, read off the landing URL.
 *
 * Flat at the metadata top level to match the legacy donate app, which the platform
 * already queries as `metadata->>'utm_source'`.
 */
export interface DonationUtm {
  utm_source?: string;
  utm_medium?: string;
  /** The sender's own campaign ID, e.g. from an ad platform or a Planet widget. */
  utm_id?: string;
  utm_content?: string;
  utm_term?: string;
  /** The URL's own campaign. `utm_campaign` itself is reserved, see below. */
  utm_campaign_name?: string;
}

export interface DonationMetadata extends DonationUtm {
  /**
   * Fundraiser GUID (`fr_*`) or legacy HID, not a campaign name despite the key.
   * The platform's FundraiserSubscriber matches on this to attach the donation.
   */
  utm_campaign: string;
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

export interface DonationPayloadBase {
  /** base donation total excluding fees, decimal */
  amount: number;
  currency: string;
  frequency: DonationFrequency;
  lineItems: LineItem[];
  donorAlias?: string;
  metadata: DonationMetadata;
  gift?: SentInvitationGift;
}

/** For PlanetCash only */
export interface PrepaidDonationPayload extends DonationPayloadBase {
  prePaid: true;
}

/** For all payment methods besides PlanetCash */
export interface PostpaidDonationPayload extends DonationPayloadBase {
  donor: DonorInfo;
  /** processing fee covered by donor, decimal, only if donor decides to cover fee */
  absorbedFee?: number;
}

export type DonationPayload = PrepaidDonationPayload | PostpaidDonationPayload;

export interface DonationResponse {
  success: boolean;
  donationId?: string;
  message?: string;
  errors?: Record<string, string>;
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
export interface DonationFormData {
  amount: number;
  currency: string;
  frequency: string;
  isAnonymous: boolean;
  receiptAddress?: string;
  donor: {
    firstname: string;
    lastname: string;
    email: string;
    address?: string;
    address2?: string;
    zipCode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface DonationPayload {
  currency: string;
  donor?: DonorInfo; // Optional when receiptAddress is provided
  lineItems: LineItem[];
  donorAlias?: string;
  metadata: DonationMetadata;
  prePaid?: boolean; // true for PlanetCash, omit for other methods
  receiptAddress?: string; // Address ID for logged-in users
}

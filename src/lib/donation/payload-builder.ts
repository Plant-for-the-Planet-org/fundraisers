import type { UserProfileResponse } from '../api/user-service';
import type { Fundraiser } from '../types/fundraiser';
import type { DonationFormValues } from '@/components/donate/donation-form-context';
import type { DonationData } from '@/components/donate/donate-overlay';
import type { DonationFormData, DonationPayload } from '../types/donation';

import { getPrimaryAddress } from '../utils/profile';
import { calculateLineItems } from './line-item-calculator';

/**
 * Builds donation metadata including fundraiser context and custom fields
 */
export function buildDonationMetadata(
  formData: DonationFormData,
  fundraiserData: Fundraiser,
  userProfile?: UserProfileResponse,
  sourceUrl?: string,
  referrer?: string
): DonationPayload['metadata'] {
  return {
    utm_campaign: fundraiserData.id,
    fundraiser: {
      id: fundraiserData.id,
      source:
        sourceUrl ||
        (typeof window !== 'undefined'
          ? `${window.location.origin}/${fundraiserData.id}`
          : `https://example.com/${fundraiserData.id}`),
      referrer: referrer || 'direct',
      user_id: userProfile?.id,
      privacy: {
        is_anonymous: formData.isAnonymous,
      },
    },
  };
}
/**
 * Maps form donor data to API donor structure
 * Pre-populates from user profile if available
 */
export function buildDonorInfo(
  formData: DonationFormData,
  userProfile?: UserProfileResponse
): DonationPayload['donor'] {
  // Use form data as primary source, fall back to profile data
  const primaryAddress = getPrimaryAddress(userProfile?.addresses ?? []);
  return {
    firstname: formData.donor.firstname || userProfile?.firstname || '',
    lastname: formData.donor.lastname || userProfile?.lastname || '',
    email: formData.donor.email || userProfile?.email || '',
    address: formData.donor.address || primaryAddress.address,
    zipCode: formData.donor.zipCode || primaryAddress.zipCode || '',
    city: formData.donor.city || primaryAddress.city || '',
    country:
      formData.donor.country ||
      primaryAddress.country ||
      userProfile?.country ||
      '',
  };
}
/**
 * Builds donor alias (display name) for the donation
 */
export function buildDonorAlias(
  formData: DonationFormData,
  userProfile?: UserProfileResponse
): string | undefined {
  // If anonymous, don't include alias
  if (formData.isAnonymous) {
    return undefined;
  }

  // Build display name from form data or profile
  const firstname = formData.donor.firstname || userProfile?.firstname;
  const lastname = formData.donor.lastname || userProfile?.lastname;

  if (firstname && lastname) {
    return `${firstname} ${lastname}`;
  } else if (firstname) {
    return firstname;
  } else if (lastname) {
    return lastname;
  }

  return undefined;
}

/** Assembles intermediate form data from donation context and user input */
export function assembleFormData(
  donationData: DonationData,
  fundraiser: Fundraiser,
  values: DonationFormValues,
  isAuthenticated: boolean
): DonationFormData {
  const formData: DonationFormData = {
    amount: donationData.amount || 0,
    currency: donationData.currency || fundraiser.currency || 'EUR',
    frequency: donationData.frequency || 'one-time',
    isAnonymous: values.isAnonymous,
    donor: {
      firstname: values.firstname,
      lastname: values.lastname,
      email: values.email,
    },
  };

  if (isAuthenticated && values.selectedAddressId) {
    formData.receiptAddress = values.selectedAddressId;
  } else {
    formData.donor.address = values.address;
    formData.donor.address2 = values.address2;
    formData.donor.zipCode = values.zipCode;
    formData.donor.city = values.city;
    formData.donor.state = values.state;
    formData.donor.country = values.country;
  }

  return formData;
}

/** Returns the current page URL as the donation source */
function getSourceUrl(fundraiserId: string): string | undefined {
  return typeof window !== 'undefined'
    ? `${window.location.origin}/${fundraiserId}`
    : undefined;
}

/** Returns the referring hostname, or 'direct' if none */
function getReferrer(): string {
  return typeof window !== 'undefined' && document.referrer
    ? new URL(document.referrer).hostname
    : 'direct';
}

/** Builds the full donation payload ready for API submission */
export function buildDonationPayload(
  formData: DonationFormData,
  fundraiser: Fundraiser,
  donorProfile: UserProfileResponse | undefined,
  isPlanetCash: boolean
): DonationPayload {
  const sourceUrl = getSourceUrl(fundraiser.id);
  const referrer = getReferrer();

  const lineItems = calculateLineItems(
    formData.amount,
    fundraiser.projectAllocations
  );
  const donorInfo = buildDonorInfo(formData, donorProfile);
  const metadata = buildDonationMetadata(
    formData,
    fundraiser,
    donorProfile,
    sourceUrl,
    referrer
  );
  const donorAlias = buildDonorAlias(formData, donorProfile);

  const payload: DonationPayload = {
    currency: formData.currency,
    lineItems,
    donorAlias,
    metadata,
  };

  // For logged-in users with receiptAddress, don't include donor object
  if (formData.receiptAddress) {
    payload.receiptAddress = formData.receiptAddress;
  } else {
    payload.donor = donorInfo;
  }

  if (isPlanetCash) {
    payload.prePaid = true;
  }

  return payload;
}

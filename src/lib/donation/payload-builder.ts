import type { DonationData } from '@/components/donate/donate-overlay';
import type { DonationFormValues } from '@/components/donate/donation-form-context';
import type { UserProfileResponse } from '../api/user-service';
import type {
  DonationFormData,
  DonationFrequency,
  DonationPayload,
  DonorInfo,
  GuestFormData,
} from '../types/donation';
import type { Fundraiser } from '../types/fundraiser';

import { getPrimaryAddress } from '../utils/profile';
import { calculateLineItems } from './line-item-calculator';

export function calculateFrequency(
  frequency: DonationFrequency,
  makeMonthly: boolean
): DonationFrequency {
  if (frequency === 'once') {
    return makeMonthly ? 'monthly' : 'once';
  }
  return frequency;
}

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
  const source = sourceUrl || getSourceUrl(fundraiserData.id);

  return {
    utm_campaign: fundraiserData.id,
    fundraiser: {
      id: fundraiserData.id,
      ...(source && { source }),
      referrer: referrer || 'direct',
      user_id: userProfile?.id,
      privacy: {
        is_anonymous: formData.isAnonymous,
      },
    },
  };
}
/**
 * Maps guest form data to API donor structure.
 * Pre-populates missing fields from user profile if available.
 */
export function buildDonorInfo(
  formData: GuestFormData,
  userProfile?: UserProfileResponse
): DonorInfo {
  const primaryAddress = getPrimaryAddress(userProfile?.addresses ?? []);
  const donorInfo: DonorInfo = {
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

  if (formData.companyName) {
    donorInfo.companyname = formData.companyName;
  }

  return donorInfo;
}
/**
 * Builds donor alias (display name) for the donation.
 * Guest donors use form-supplied names; authenticated donors use their profile.
 */
export function buildDonorAlias(
  formData: DonationFormData,
  userProfile?: UserProfileResponse
): string | undefined {
  if (formData.isAnonymous) {
    return undefined;
  }

  const firstname =
    (formData.type === 'guest' ? formData.donor.firstname : undefined) ||
    userProfile?.firstname;
  const lastname =
    (formData.type === 'guest' ? formData.donor.lastname : undefined) ||
    userProfile?.lastname;

  if (firstname && lastname) {
    return `${firstname} ${lastname}`;
  }

  return firstname || lastname || undefined;
}

/** Assembles intermediate form data from donation context and user input */
export function assembleFormData(
  donationData: DonationData,
  fundraiser: Fundraiser,
  values: DonationFormValues,
  isAuthenticated: boolean
): DonationFormData {
  const base = {
    amount: donationData.amount || 0,
    currency: donationData.currency || fundraiser.currency || 'EUR',
    frequency: calculateFrequency(donationData.frequency, values.makeMonthly),
    isAnonymous: values.isAnonymous,
  };

  const selectedAddressId = values.selectedAddressId || undefined;

  if (isAuthenticated && selectedAddressId) {
    return {
      ...base,
      type: 'authenticated' as const,
      receiptAddress: selectedAddressId,
    };
  }

  return {
    ...base,
    type: 'guest' as const,
    donor: {
      firstname: values.firstname,
      lastname: values.lastname,
      email: values.email,
      address: values.address,
      address2: values.address2,
      zipCode: values.zipCode,
      city: values.city,
      state: values.state,
      country: values.country,
    },
    ...(values.isCompany && values.companyName
      ? { companyName: values.companyName }
      : {}),
  };
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
  const metadata = buildDonationMetadata(
    formData,
    fundraiser,
    donorProfile,
    sourceUrl,
    referrer
  );
  const donorAlias = buildDonorAlias(formData, donorProfile);

  const base = {
    currency: formData.currency,
    frequency: formData.frequency,
    lineItems,
    donorAlias,
    metadata,
    ...(isPlanetCash && { prePaid: true }),
  };

  if (formData.type === 'authenticated') {
    return {
      ...base,
      receiptAddress: formData.receiptAddress,
    };
  }

  const donor = buildDonorInfo(formData, donorProfile);
  return { ...base, donor };
}

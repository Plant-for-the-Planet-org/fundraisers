import type { DonationData } from '@/components/donate/donate-overlay';
import type { DonationFormValues } from '@/components/donate/donation-form-context';
import type { UserProfileResponse } from '../api/user-service';
import type {
  AuthenticatedFormData,
  DonationFormData,
  DonationFrequency,
  DonationPayload,
  DonationPayloadBase,
  DonorInfo,
  GuestFormData,
} from '../types/donation';
import type { Fundraiser } from '../types/fundraiser';
import type { PaymentMethodId } from '../types/payment-methods';

import { getDefaultCauseId } from '../utils/project-allocation';
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
  referrer?: string,
  willAbsorbFee?: boolean,
  processingFeeCents?: number
): DonationPayload['metadata'] {
  const source = sourceUrl || getSourceUrl(fundraiserData.id);
  const isAbsorbingFee =
    willAbsorbFee && processingFeeCents && processingFeeCents > 0;

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
    ...(isAbsorbingFee && {
      fees: {
        is_fee_absorbed: true,
        fee_amount: processingFeeCents / 100,
      },
    }),
  };
}
export function buildGuestDonorInfo(formData: GuestFormData): DonorInfo {
  const donorInfo: DonorInfo = {
    firstname: formData.donor.firstname,
    lastname: formData.donor.lastname,
    email: formData.donor.email,
    address: formData.donor.address,
    address2: formData.donor.address2 || undefined,
    zipCode: formData.donor.zipCode,
    city: formData.donor.city,
    state: formData.donor.state || undefined,
    country: formData.donor.country,
    tin: formData.tin || null,
  };

  if (formData.companyName) {
    donorInfo.companyname = formData.companyName;
  }

  return donorInfo;
}
/**
 * Maps authenticated form data to API donor structure.
 * Personal details come from the profile; address fields come from the saved
 * address identified by `receiptAddress`.
 */
export function buildAuthenticatedDonorInfo(
  formData: AuthenticatedFormData,
  userProfile?: UserProfileResponse
): DonorInfo {
  const selectedAddress = userProfile?.addresses.find(
    addr => addr.id === formData.receiptAddress
  );

  return {
    firstname: userProfile?.firstname || '',
    lastname: userProfile?.lastname || '',
    email: userProfile?.email || '',
    address: selectedAddress?.address,
    address2: selectedAddress?.address2 ?? undefined,
    zipCode: selectedAddress?.zipCode,
    city: selectedAddress?.city,
    state: selectedAddress?.state ?? undefined,
    country: selectedAddress?.country || userProfile?.country || '',
    tin: formData.tin || null,
  };
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
    amountCents: donationData.amountCents || 0,
    currency: donationData.currency || fundraiser.currency || 'EUR',
    frequency: calculateFrequency(donationData.frequency, values.makeMonthly),
    isAnonymous: values.isAnonymous,
    tin: values.tin?.trim() || undefined,
    ...(donationData.gift && { gift: donationData.gift }),
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
  selectedPaymentMethod: PaymentMethodId,
  willAbsorbFee: boolean,
  processingFeeCents: number
): DonationPayload {
  const sourceUrl = getSourceUrl(fundraiser.id);
  const referrer = getReferrer();

  const lineItems = calculateLineItems(
    formData.amountCents,
    fundraiser.projectAllocations,
    getDefaultCauseId(fundraiser.workspace?.country ?? '')
  );
  const metadata = buildDonationMetadata(
    formData,
    fundraiser,
    donorProfile,
    sourceUrl,
    referrer,
    willAbsorbFee,
    processingFeeCents
  );
  const donorAlias = buildDonorAlias(formData, donorProfile);
  const baseDonationPayload: DonationPayloadBase = {
    amount: formData.amountCents / 100,
    currency: formData.currency,
    frequency: formData.frequency,
    lineItems,
    donorAlias,
    metadata,
    ...(formData.gift && { gift: formData.gift }),
  };

  if (selectedPaymentMethod === 'planet_cash') {
    return { ...baseDonationPayload, prePaid: true };
  }

  const absorbedFee =
    willAbsorbFee && processingFeeCents > 0
      ? { absorbedFee: processingFeeCents / 100 }
      : undefined;

  const donor =
    formData.type === 'authenticated'
      ? buildAuthenticatedDonorInfo(formData, donorProfile)
      : buildGuestDonorInfo(formData);

  return { ...baseDonationPayload, ...absorbedFee, donor };
}

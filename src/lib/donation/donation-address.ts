import type { Address, UserProfileResponse } from '@/lib/api/user-service';
import type { GuestFormData } from '@/lib/types/donation';

function resolveSelectedAddress(
  donorProfile: UserProfileResponse | undefined,
  selectedAddressId: string | undefined
): Address | undefined {
  return (
    donorProfile?.addresses.find(a => a.id === selectedAddressId) ??
    donorProfile?.addresses[0]
  );
}

/**
 * Resolves the billing address for payment method creation.
 * Guest form data takes precedence; falls back to the selected saved address,
 * then profile country for the country field.
 */
export function buildDonorBillingAddress(
  donor: GuestFormData['donor'] | null,
  donorProfile: UserProfileResponse | undefined,
  selectedAddressId: string | undefined
): {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
} {
  const selectedAddress = resolveSelectedAddress(
    donorProfile,
    selectedAddressId
  );
  return {
    line1: donor?.address ?? selectedAddress?.address ?? '',
    line2: donor?.address2 ?? selectedAddress?.address2 ?? undefined,
    city: donor?.city ?? selectedAddress?.city ?? '',
    state: donor?.state ?? selectedAddress?.state ?? undefined,
    zipCode: donor?.zipCode ?? selectedAddress?.zipCode ?? '',
    country:
      donor?.country ?? selectedAddress?.country ?? donorProfile?.country ?? '',
  };
}

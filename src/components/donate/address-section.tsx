'use client';
import type { DonationFormValues } from './donation-form-context';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { getPrimaryAddress } from '@/lib/utils/profile';
import { useAuthStore } from '@/stores/authStore';
import { AddressForm } from './address-form';
import { AddressSelector } from './address-selector';

export function AddressSection() {
  const { watch, setValue, resetField } = useFormContext<DonationFormValues>();

  const selectedAddressId = watch('selectedAddressId');

  const profile = useAuthStore(state => state.user?.profile);

  // Keep a valid selected address.
  // If current selection is empty/invalid, initialize to the primary address.
  // If no primary, select the first address.
  // If no addresses, select "new" to show empty form.
  useEffect(() => {
    if (!profile) return;

    const hasValidSelection =
      selectedAddressId === 'new' ||
      profile.addresses.some(address => address.id === selectedAddressId);
    if (hasValidSelection) return;

    const primary = getPrimaryAddress(profile.addresses);
    if (primary) {
      setValue('selectedAddressId', primary.id);
      return;
    }

    const firstAddress = profile.addresses[0];
    setValue('selectedAddressId', firstAddress?.id ?? 'new');
  }, [profile, selectedAddressId, setValue]);

  // Sync rhf form state with selected address when selection changes.
  useEffect(() => {
    if (!profile || !selectedAddressId) return;

    if (selectedAddressId === 'new') {
      setValue('address', '', { shouldDirty: false });
      setValue('address2', '', { shouldDirty: false });
      setValue('zipCode', '', { shouldDirty: false });
      setValue('city', '', { shouldDirty: false });
      setValue('state', '', { shouldDirty: false });
      setValue('country', '', { shouldDirty: false });

      return;
    }

    const selectedAddress = profile.addresses.find(
      a => a.id === selectedAddressId
    );
    if (!selectedAddress) return;

    // When switching away from "new", AddressForm unmounts.
    // Reset address-related fields to selected values so hidden form state
    // (errors/touched/dirty) does not leak across mode switches.
    resetField('address', { defaultValue: selectedAddress.address });
    resetField('address2', { defaultValue: selectedAddress.address2 ?? '' });
    resetField('zipCode', { defaultValue: selectedAddress.zipCode });
    resetField('city', { defaultValue: selectedAddress.city });
    resetField('state', { defaultValue: selectedAddress.state ?? '' });
    resetField('country', { defaultValue: selectedAddress.country });
  }, [selectedAddressId, profile, resetField, setValue]);

  return (
    <div className='address-section space-y-4'>
      <AddressSelector />
      {selectedAddressId === 'new' && <AddressForm />}
    </div>
  );
}

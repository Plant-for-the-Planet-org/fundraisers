'use client';
import type { DonationFormValues } from './donation-form-context';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { AddressSelector } from './address-selector';
import { AddressForm } from './address-form';
import { useAuthStore } from '@/stores/authStore';
import { getPrimaryAddress } from '@/lib/utils/profile';

export function AddressSection() {
  const { watch, setValue, resetField } = useFormContext<DonationFormValues>();

  const selectedAddressId = watch('selectedAddressId');

  const profile = useAuthStore(state => state.user?.profile);

  // Set default address (only once when profile loads)
  useEffect(() => {
    if (!profile) return;

    const primary = getPrimaryAddress(profile.addresses);
    if (!primary) return;

    setValue('selectedAddressId', primary.id);
  }, [profile, setValue]);

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
    <div className='space-y-4'>
      <AddressSelector />

      {selectedAddressId === 'new' && <AddressForm />}
    </div>
  );
}

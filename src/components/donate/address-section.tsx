'use client';
import type { DonationFormValues } from './donation-form-context';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { AddressSelector } from './address-selector';
import { AddressForm } from './address-form';
import { useAuthStore } from '@/stores/authStore';
import { getPrimaryAddress } from '@/lib/utils/profile';

export function AddressSection() {
  const { watch, setValue } = useFormContext<DonationFormValues>();

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

    setValue('address', selectedAddress.address, { shouldDirty: false });
    setValue('address2', selectedAddress.address2 ?? '', {
      shouldDirty: false,
    });
    setValue('zipCode', selectedAddress.zipCode, { shouldDirty: false });
    setValue('city', selectedAddress.city, { shouldDirty: false });
    setValue('state', selectedAddress.state ?? '', { shouldDirty: false });
    setValue('country', selectedAddress.country, { shouldDirty: false });
  }, [selectedAddressId, profile, setValue]);

  return (
    <div className='space-y-4'>
      <AddressSelector />

      {selectedAddressId === 'new' && <AddressForm />}
    </div>
  );
}

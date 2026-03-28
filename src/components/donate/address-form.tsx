'use client';
import type { DonationFormValues } from './donation-form-context';

import { useController, useFormContext, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '../ui/button';
import { addressService } from '@/lib/api/address-service';
import { AddressTypeRadioGroup } from './address-type-radio-group';
import { FormField } from './form-field';
import { buildAddressPayload } from '@/lib/utils/profile';
import { AddressCountrySelector } from './address-country-selector';
import { useFieldError } from './use-field-error';

export const AddressForm = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const token = useAuthStore(state => state.accessToken);
  const refreshProfile = useAuthStore(state => state.refreshProfile);
  const tDonate = useTranslations('Donate.userAddress');
  const translateError = useFieldError();

  const [isLoading, setIsLoading] = useState(false);
  const [saveAddressError, setSaveAddressError] = useState<string | null>(null);

  const {
    register,
    formState: { errors },
    setValue,
    trigger,
    getValues,
  } = useFormContext<DonationFormValues>();

  const {
    field: { value: country, onChange: setCountry, onBlur: onCountryBlur },
  } = useController<DonationFormValues, 'country'>({
    name: 'country',
  });

  const watchedFields = useWatch({
    name: ['address', 'city', 'zipCode', 'country'],
  });
  const isAddressValid = watchedFields.every(Boolean);

  const handleSaveAddress = async () => {
    const isValid = await trigger(['address', 'city', 'zipCode', 'country']);

    if (!isValid || !token) return;

    setIsLoading(true);
    setSaveAddressError(null);
    try {
      const payload = buildAddressPayload(getValues());

      const createdAddress = await addressService.createAddress(token, payload);
      await refreshProfile();
      // Select the newly created address and exit new address mode
      setValue('selectedAddressId', createdAddress.id);
    } catch (err) {
      setSaveAddressError(
        err instanceof Error ? err.message : 'Failed to save address'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isAuthenticated && <AddressTypeRadioGroup register={register} />}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='space-y-2 sm:col-span-2'>
          <AddressCountrySelector
            country={country}
            onCountryChange={setCountry}
            onCountryBlur={onCountryBlur}
            error={translateError(errors.country?.message)}
          />
        </div>
        <div className='space-y-2'>
          <FormField
            label={tDonate('zipCode.label')}
            error={errors.zipCode?.message}
          >
            <Input
              {...register('zipCode')}
              placeholder={tDonate('zipCode.placeholder')}
              className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
            />
          </FormField>
        </div>
      </div>
      {/* Address + City */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='sm:col-span-2'>
          <FormField
            label={tDonate('address.label')}
            error={errors.address?.message}
          >
            <Input
              {...register('address')}
              placeholder={tDonate('address.placeholder')}
              className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
            />
          </FormField>
        </div>
        <FormField label={tDonate('city.label')} error={errors.city?.message}>
          <Input
            {...register('city')}
            placeholder={tDonate('city.placeholder')}
            className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
          />
        </FormField>
      </div>
      {/* Address2 + State */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 '>
        <div className='sm:col-span-2'>
          <FormField
            label={tDonate('address2.label')}
            error={errors.address2?.message}
          >
            <Input
              {...register('address2')}
              placeholder={tDonate('address2.placeholder')}
              className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
            />
          </FormField>
        </div>
        <FormField label={tDonate('state.label')} error={errors.state?.message}>
          <Input
            {...register('state')}
            placeholder={tDonate('state.placeholder')}
            className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
          />
        </FormField>
      </div>
      {saveAddressError && (
        <p className='text-sm text-red-500'>{saveAddressError}</p>
      )}
      {isAuthenticated && (
        <div className='mt-5'>
          <Button
            type='button'
            onClick={handleSaveAddress}
            disabled={isLoading || !isAddressValid}
            className='w-full sm:w-auto'
          >
            {isLoading ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                {tDonate('savingAddressLoader')}
              </>
            ) : (
              tDonate('saveAddress')
            )}
          </Button>
        </div>
      )}
    </>
  );
};

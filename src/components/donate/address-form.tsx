'use client';
import type { DonationFormValues } from './donation-form-context';

import { useController, useFormContext } from 'react-hook-form';
import { useRef, useState } from 'react';
import {
  getAllCountries,
  getCountryDisplay,
  searchCountries,
} from '@/lib/utils/country';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '../ui/button';
import { addressService } from '@/lib/api/address-service';
import { AddressTypeRadioGroup } from './address-type-radio-group';
import { FormField } from './form-field';

export const AddressForm = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const token = useAuthStore(state => state.accessToken);

  const tDonate = useTranslations('Donate.userAddress');

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  const allCountries = getAllCountries('en');

  // Filter countries based on search
  const filteredCountries = countrySearch
    ? searchCountries(countrySearch, 'en')
    : allCountries;

  const handleCountrySelect = (code: string) => {
    setCountry(code);
    setIsCountryDropdownOpen(false);
  };
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useFormContext<DonationFormValues>();

  const watchedFields = watch(['address', 'city', 'zipCode', 'country']);
  const isAddressValid = watchedFields.every(Boolean);

  const {
    field: { value: country, onChange: setCountry },
  } = useController({
    name: 'country',
    control,
  });

  const { trigger, getValues } = useFormContext<DonationFormValues>();

  const handleSaveAddress = async () => {
    const isValid = await trigger(['address', 'city', 'zipCode', 'country']);

    if (!isValid || !token) return;

    const { address, city, zipCode, country, address2, state, addressType } =
      getValues();
    setIsLoading(true);
    try {
      const addressData = {
        type: addressType,
        name:
          addressType === 'primary'
            ? 'Primary'
            : addressType === 'mailing'
              ? 'Mailing'
              : 'Other',
        address1: address,
        address2: address2 || undefined,
        city,
        zipCode,
        state: state || undefined,
        country,
      };

      await addressService.createAddress(token, addressData);

      //   await refreshProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isAuthenticated && <AddressTypeRadioGroup register={register} />}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='space-y-2 sm:col-span-2'>
          {/* Country Dropdown */}
          <FormField
            label={tDonate('country.label')}
            error={errors.zipCode?.message}
          >
            <div className='relative mt-2' ref={countryDropdownRef}>
              <div
                className='flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer hover:border-gray-400 focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500'
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              >
                {country ? (
                  <span className='flex items-center gap-2'>
                    {getCountryDisplay(country, 'en').display}
                  </span>
                ) : (
                  <span className='text-gray-500'>
                    {tDonate('country.selectCountry')}
                  </span>
                )}
                <ChevronDown className='h-4 w-4 opacity-50' />
              </div>

              {isCountryDropdownOpen && (
                <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden'>
                  <div className='p-2 border-b border-gray-100'>
                    <Input
                      placeholder={tDonate('country.searchPlaceholder')}
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      className='h-8 text-sm'
                      autoFocus
                    />
                  </div>
                  <div className='max-h-48 overflow-y-auto'>
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map(countryOption => (
                        <div
                          key={countryOption.code}
                          className='flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 focus:bg-gray-50'
                          onClick={() =>
                            handleCountrySelect(countryOption.code)
                          }
                        >
                          {countryOption.flag} {countryOption.name}
                          {country === countryOption.code && (
                            <Check className='h-4 w-4 ml-auto text-gray-900' />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className='px-3 py-2 text-sm text-gray-500'>
                        {tDonate('country.noResults')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FormField>
        </div>
        <div className='space-y-2'>
          <FormField
            label={tDonate('zipCode.label')}
            error={errors.zipCode?.message}
          >
            <Input
              {...register('zipCode')}
              placeholder={tDonate('zipCode.placeholder')}
              className={cn(
                'border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
              )}
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
              className={cn(
                'border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
              )}
            />
          </FormField>
        </div>
        <FormField label={tDonate('city.label')} error={errors.city?.message}>
          <Input
            {...register('city')}
            placeholder={tDonate('city.placeholder')}
            className={cn(
              'border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
            )}
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
            className={cn(
              'border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
            )}
          />
        </FormField>
      </div>
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

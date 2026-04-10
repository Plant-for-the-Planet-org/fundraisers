'use client';
import type { DonationFormValues } from './donation-form-context';

import { useState } from 'react';
import { useController,useFormContext } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getCountry } from '@/lib/utils/country';
import { useAuthStore } from '@/stores/authStore';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export function AddressSelector() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const tDonate = useTranslations('Donate.userAddress');
  const { control } = useFormContext<DonationFormValues>();
  const locale = useLocale();
  const profile = useAuthStore(state => state.user?.profile);

  const {
    field: { value: selectedAddressId, onChange },
  } = useController<DonationFormValues, 'selectedAddressId'>({
    name: 'selectedAddressId',
    control,
  });

  if (!profile) return null;

  return (
    <div className='address-selector w-full space-y-2'>
      <Label
        className='text-sm font-medium text-foreground'
        htmlFor='address-select'
      >
        {tDonate('selectAddress.label')}
      </Label>

      <Select
        value={selectedAddressId}
        onValueChange={value => {
          setHasInteracted(true);
          onChange(value);
        }}
      >
        <SelectTrigger
          id='address-select'
          className={cn(
            'w-full mt-2 min-h-[60px] h-auto px-3 py-3 flex items-center justify-between rounded-md focus:ring-0 focus-visible:ring-0 focus:outline-none focus:shadow-none data-[state=open]:border-gray-300 data-[state=open]:shadow-none data-[state=open]:ring-0 [&>span]:flex [&>span]:flex-col [&>span]:items-start border border-border',
            hasInteracted ? 'border border-black' : 'border-border'
          )}
        >
          <SelectValue placeholder={tDonate('selectAddress.placeholder')} />
        </SelectTrigger>

        <SelectContent
          position='popper'
          className='border border-gray-300 rounded-md shadow-sm'
        >
          {profile.addresses.map(addr => (
            <SelectItem key={addr.id} value={addr.id}>
              <div className='flex flex-col text-left'>
                <div className='flex items-center gap-2'>
                  <span className='text-foreground font-medium'>
                    {addr.address}
                  </span>
                  <span className='px-2 py-0.5 text-xs bg-gray-100 text-muted-foreground rounded-full'>
                    {addr.type.charAt(0).toUpperCase() + addr.type.slice(1)}
                  </span>
                </div>

                <span className='text-sm text-muted-foreground'>
                  {addr.city} {addr.zipCode}, {getCountry(addr.country, locale)}
                </span>
              </div>
            </SelectItem>
          ))}

          <SelectItem value='new'>{tDonate('addNewAddress')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

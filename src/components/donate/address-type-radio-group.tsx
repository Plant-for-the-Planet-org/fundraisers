'use client';
import type { UseFormRegister } from 'react-hook-form';
import type { DonationFormValues } from './donation-form-context';

import { useTranslations } from 'next-intl';

type Props = {
  register: UseFormRegister<DonationFormValues>;
};

type AddressTypeOption = {
  value: DonationFormValues['addressType'];
  label: string;
};

export const AddressTypeRadioGroup = ({ register }: Props) => {
  const tDonate = useTranslations('Donate');

  const options = [
    {
      value: 'primary',
      label: tDonate('userAddress.address.addressTypeOptions.primary'),
    },
    {
      value: 'mailing',
      label: tDonate('userAddress.address.addressTypeOptions.mailing'),
    },
    {
      value: 'other',
      label: tDonate('userAddress.address.addressTypeOptions.other'),
    },
  ] satisfies AddressTypeOption[];

  return (
    <fieldset className='space-y-2'>
      <legend className='text-sm font-medium text-foreground'>
        {tDonate('userAddress.address.addressType')}
      </legend>

      <div className='flex gap-4'>
        {options.map(option => (
          <label
            key={option.value}
            className='flex items-center gap-2 cursor-pointer'
          >
            <input
              type='radio'
              value={option.value}
              {...register('addressType')}
              className='w-4 h-4 text-foreground border-gray-300 focus:ring-gray-500'
            />
            <span className='text-sm'>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

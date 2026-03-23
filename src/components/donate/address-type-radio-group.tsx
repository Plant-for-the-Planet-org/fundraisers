'use client';
import type { UseFormRegister } from 'react-hook-form';
import type { DonationFormValues } from './donation-form-context';

import { useTranslations } from 'next-intl';
import { Label } from '../ui/label';

type Props = {
  register: UseFormRegister<DonationFormValues>;
};

export const AddressTypeRadioGroup = ({ register }: Props) => {
  const tDonate = useTranslations('Donate.userAddress');

  const options = [
    { value: 'primary', label: 'Primary' },
    { value: 'mailing', label: 'Mailing' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className='space-y-2'>
      <Label>{tDonate('address.addressType')}</Label>

      <div className='flex gap-4 mt-2'>
        {options.map(option => (
          <label
            key={option.value}
            className='flex items-center gap-2 cursor-pointer'
          >
            <input
              type='radio'
              value={option.value}
              {...register('addressType')}
              className='w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500'
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

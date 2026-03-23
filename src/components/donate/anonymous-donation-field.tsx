'use client';

import type { DonationFormValues } from './donation-form-context';

import { useController, useFormContext } from 'react-hook-form';
import { Label } from '../ui/label';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const CheckboxField = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) => (
  <div className='flex items-start gap-3'>
    <button
      onClick={() => onChange(!checked)}
      className='mt-0.5 flex-shrink-0'
      type='button'
    >
      <div
        className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
          checked
            ? 'bg-gray-900 border-gray-900'
            : 'bg-white border-gray-300 hover:border-gray-400'
        )}
      >
        {checked && <Check className='w-3 h-3 text-white' />}
      </div>
    </button>
    <div className='flex-1 space-y-1'>
      <Label
        className='text-sm font-medium text-gray-700 cursor-pointer'
        onClick={() => onChange(!checked)}
      >
        {label}
      </Label>
      {description && <p className='text-sm text-gray-500'>{description}</p>}
    </div>
  </div>
);

export const AnonymousDonationField = () => {
  const { control } = useFormContext<DonationFormValues>();
  const tDonate = useTranslations('Donate');

  const {
    field: { value, onChange },
  } = useController({
    name: 'isAnonymous',
    control,
  });

  return (
    <div className='space-y-4'>
      <CheckboxField
        checked={value}
        onChange={onChange}
        label={tDonate('preferences.anonymousDonationLabel')}
        description={
          value
            ? tDonate('preferences.anonymousDonationDescription')
            : undefined
        }
      />
    </div>
  );
};

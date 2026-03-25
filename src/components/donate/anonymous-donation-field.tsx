'use client';

import type { DonationFormValues } from './donation-form-context';

import { useController, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { CheckboxField } from './checkbox-field';

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

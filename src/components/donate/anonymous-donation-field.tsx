'use client';

import type { DonationFormValues } from './donation-form-context';

import { useController } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Checkbox } from '../ui/checkbox';

export const AnonymousDonationField = () => {
  const tDonate = useTranslations('Donate');
  const checkboxId = 'is-anonymous';
  const descriptionId = 'is-anonymous-desc';

  const {
    field: { value: isAnonymousChecked, onChange: setIsAnonymousChecked },
  } = useController<DonationFormValues, 'isAnonymous'>({
    name: 'isAnonymous',
  });

  return (
    <div className='space-y-1'>
      <div className='flex items-center gap-3'>
        <Checkbox
          id={checkboxId}
          checked={Boolean(isAnonymousChecked)}
          onCheckedChange={checked => setIsAnonymousChecked(checked === true)}
          aria-describedby={isAnonymousChecked ? descriptionId : undefined}
        />
        <label
          htmlFor={checkboxId}
          className='cursor-pointer select-none text-sm font-medium text-foreground'
        >
          {tDonate('preferences.anonymousDonationLabel')}
        </label>
      </div>
      {isAnonymousChecked && (
        <p id={descriptionId} className='pl-7 text-sm text-muted-foreground'>
          {tDonate('preferences.anonymousDonationDescription')}
        </p>
      )}
    </div>
  );
};

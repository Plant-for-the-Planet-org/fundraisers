'use client';
import type { DonationFormValues } from './donation-form-context';

import { useTranslations } from 'next-intl';
import { FormField } from './form-field';
import { Input } from '../ui/input';
import { useController, useFormContext } from 'react-hook-form';
import { Checkbox } from '../ui/checkbox';

export const DonorIdentityFields = () => {
  const tDonate = useTranslations('Donate.donorIdentity');
  const {
    register,
    formState: { errors },
    control,
    setValue,
  } = useFormContext<DonationFormValues>();

  const {
    field: { value: isCompanyChecked, onChange: setIsCompanyChecked },
  } = useController({
    name: 'isCompany',
    control,
  });

  const handleCompanyDonationToggle = (checked: boolean) => {
    setIsCompanyChecked(checked);
    if (!checked) {
      // Prevent stale company name submission after switching back to individual donation.
      setValue('companyName', '', { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <>
      <div className='flex items-start gap-3'>
        <Checkbox
          id='isCompany'
          checked={isCompanyChecked}
          onCheckedChange={handleCompanyDonationToggle}
          className='mt-0.5'
        />
        <label
          htmlFor='isCompany'
          className='cursor-pointer select-none text-sm font-medium text-foreground'
        >
          {tDonate('companyDonation.label')}
        </label>
      </div>
      {isCompanyChecked && (
        <FormField
          label={tDonate('companyName.label')}
          error={
            errors.companyName ? tDonate('companyName.required') : undefined
          }
        >
          <Input
            {...register('companyName')}
            placeholder={tDonate('companyName.placeholder')}
            className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
          />
        </FormField>
      )}

      <FormField label={tDonate('email.label')} error={errors.email?.message}>
        <Input
          type='email'
          {...register('email')}
          placeholder={tDonate('email.placeholder')}
          className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
        />
      </FormField>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <FormField
          label={tDonate('firstName.label')}
          error={errors.firstname?.message}
        >
          <Input
            {...register('firstname')}
            placeholder={tDonate('firstName.placeholder')}
            className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
          />
        </FormField>

        <FormField
          label={tDonate('lastName.label')}
          error={errors.lastname?.message}
        >
          <Input
            {...register('lastname')}
            placeholder={tDonate('lastName.placeholder')}
            className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
          />
        </FormField>
      </div>
    </>
  );
};

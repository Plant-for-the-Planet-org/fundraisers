'use client';
import type { DonationFormValues } from './donation-form-context';

import { useController, useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { FormField } from './form-field';
import { useFieldError } from './use-field-error';

export const DonorIdentityFields = () => {
  const tDonate = useTranslations('Donate.donorIdentity');
  const translateError = useFieldError();
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext<DonationFormValues>();

  const {
    field: { value: isCompanyChecked, onChange: setIsCompanyChecked },
  } = useController<DonationFormValues, 'isCompany'>({
    name: 'isCompany',
  });

  const handleCompanyDonationToggle = (checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setIsCompanyChecked(isChecked);
    if (!isChecked) {
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
          error={translateError(errors.companyName?.message)}
        >
          <Input
            {...register('companyName')}
            autoComplete='organization'
            placeholder={tDonate('companyName.placeholder')}
            className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
          />
        </FormField>
      )}

      <FormField
        label={tDonate('email.label')}
        error={translateError(errors.email?.message)}
      >
        <Input
          type='email'
          {...register('email')}
          autoComplete='email'
          placeholder={tDonate('email.placeholder')}
          className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
        />
      </FormField>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <FormField
          label={tDonate('firstName.label')}
          error={translateError(errors.firstname?.message)}
        >
          <Input
            {...register('firstname')}
            autoComplete='given-name'
            placeholder={tDonate('firstName.placeholder')}
            className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
          />
        </FormField>

        <FormField
          label={tDonate('lastName.label')}
          error={translateError(errors.lastname?.message)}
        >
          <Input
            {...register('lastname')}
            autoComplete='family-name'
            placeholder={tDonate('lastName.placeholder')}
            className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
          />
        </FormField>
      </div>
    </>
  );
};

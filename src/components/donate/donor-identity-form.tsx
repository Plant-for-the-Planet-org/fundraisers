'use client';
import type { DonationFormValues } from './donation-form-context';

import { useTranslations } from 'next-intl';
import { FormField } from './form-field';
import { Input } from '../ui/input';
import { useController, useFormContext } from 'react-hook-form';
import { CheckboxField } from './checkbox-field';

export const DonorIdentityForm = () => {
  const tDonate = useTranslations('Donate.donorIdentity');
  const {
    register,
    formState: { errors },
    control,
    watch,
  } = useFormContext<DonationFormValues>();

  const {
    field: { value, onChange },
  } = useController({
    name: 'isCompany',
    control,
  });

  const isCompanyDonation = watch('isCompany');
  return (
    <>
      <CheckboxField
        checked={value}
        onChange={onChange}
        label='This donation is made by a Company'
      />

      {isCompanyDonation && (
        <div className='space-y-2 ml-6'>
          <FormField
            label={tDonate('companyName.label')}
            error={errors.companyName?.message}
          >
            <Input
              placeholder={tDonate('companyName.placeholder')}
              className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
            />
          </FormField>
        </div>
      )}
      <FormField label={tDonate('email.label')} error={errors.email?.message}>
        <Input
          type='email'
          {...register('address')}
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

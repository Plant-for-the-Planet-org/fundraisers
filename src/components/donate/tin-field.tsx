'use client';
import type { DonationFormValues } from './donation-form-context';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '../ui/input';
import { useDonationForm } from './donation-form-context';
import { FormField } from './form-field';
import { useFieldError } from './use-field-error';

export const TinField = () => {
  const { fundraiser } = useDonationForm();
  const isSpain = fundraiser.workspace?.country === 'ES';

  const profileTin = useAuthStore(state => state.user?.profile?.tin);

  const tDonate = useTranslations('Donate.donorIdentity');
  const translateError = useFieldError();
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext<DonationFormValues>();

  useEffect(() => {
    if (isSpain && profileTin) {
      setValue('tin', profileTin, { shouldDirty: false });
    }
  }, [isSpain, profileTin, setValue]);

  if (!isSpain) return null;

  return (
    <FormField
      label={tDonate('tin.label')}
      error={translateError(errors.tin?.message)}
    >
      <Input
        {...register('tin')}
        placeholder={tDonate('tin.placeholder')}
        className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2'
      />
    </FormField>
  );
};

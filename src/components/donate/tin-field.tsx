'use client';
import type { DonationFormValues } from './donation-form-context';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { getWorkspaceProfile } from '@/lib/workspaces/registry';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '../ui/input';
import { useDonationForm } from './donation-form-context';
import { FormField } from './form-field';
import { useFieldError } from './use-field-error';

export const TinField = () => {
  const { fundraiser } = useDonationForm();
  const workspaceCountry = fundraiser.workspace?.country;
  const requiresTin = workspaceCountry
    ? getWorkspaceProfile(workspaceCountry).requiresTin
    : false;

  const profileTin = useAuthStore(state => state.user?.profile?.tin);

  const tDonate = useTranslations('Donate.donorIdentity');
  const translateError = useFieldError();
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext<DonationFormValues>();

  useEffect(() => {
    if (requiresTin && profileTin) {
      setValue('tin', profileTin, { shouldDirty: false });
    }
  }, [requiresTin, profileTin, setValue]);

  if (!requiresTin) return null;

  return (
    <FormField
      label={tDonate('tin.label')}
      error={translateError(errors.tin?.message)}
    >
      <Input
        {...register('tin')}
        placeholder={tDonate('tin.placeholder')}
        readOnly={Boolean(profileTin)}
        className='border-gray-300 focus:border-gray-500 focus:ring-gray-500 mt-2 read-only:bg-gray-100 read-only:cursor-not-allowed'
      />
    </FormField>
  );
};

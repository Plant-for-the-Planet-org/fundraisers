'use client';

import type { ReactNode } from 'react';
import type { DonationFormValues } from './donation-form-context';

import { useTranslations } from 'next-intl';
import { useDonationForm } from './donation-form-context';
import { Button } from '../ui/button';
import { CheckIcon } from '../ui/check-icon';
import { Spinner } from '../ui/spinner';
import { useFormContext, useWatch } from 'react-hook-form';

interface DonateCTAProps {
  isLoading: boolean;
  isSuccess: boolean;
}

export function DonateCTA({ isLoading, isSuccess }: DonateCTAProps) {
  const t = useTranslations('Donate');
  const { donationData, onSubmit } = useDonationForm();
  const { handleSubmit } = useFormContext<DonationFormValues>();

  const makeMonthly = useWatch<DonationFormValues, 'makeMonthly'>({
    name: 'makeMonthly',
  });

  const isMonthly = donationData.frequency === 'monthly' || makeMonthly;
  const isYearly = donationData.frequency === 'yearly';

  const buttonText = isYearly
    ? t('cta.donateYearly')
    : isMonthly
      ? t('cta.donateMonthly')
      : t('cta.donateNow');

  let buttonContent: ReactNode;
  if (isLoading) {
    buttonContent = (
      <>
        <Spinner />
        {t('cta.processing')}
      </>
    );
  } else if (isSuccess) {
    buttonContent = (
      <>
        <CheckIcon />
        {t('cta.success')}
      </>
    );
  } else {
    buttonContent = <span className='font-semibold'>{buttonText}</span>;
  }

  return (
    <div className='space-y-6'>
      <Button
        className='w-full h-12 bg-gray-900 hover:bg-gray-700 text-white font-medium disabled:opacity-50'
        onClick={handleSubmit(onSubmit)}
        disabled={isLoading || isSuccess}
      >
        <div className='flex items-center gap-2'>{buttonContent}</div>
      </Button>
      {/* Native Payments - for future implementation */}
      {/* <Button
        variant='outline'
        className='w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium flex items-center gap-2'
      >
        Pay with Google
      </Button> */}
    </div>
  );
}

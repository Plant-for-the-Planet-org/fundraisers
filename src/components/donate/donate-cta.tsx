'use client';

import type { DonationFormValues } from './donation-form-context';

import { useTranslations } from 'next-intl';
import { useDonationForm } from './donation-form-context';
import { Button } from '../ui/button';
import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';

export function DonateCTA() {
  const t = useTranslations('Donate');
  const { donationData, onSubmit } = useDonationForm();
  const { handleSubmit, watch } = useFormContext<DonationFormValues>();
  const makeMonthly = watch('makeMonthly');

  const buttonText = useMemo(() => {
    const isMonthly = donationData.frequency === 'monthly' || makeMonthly;
    const isYearly = donationData.frequency === 'yearly';
    if (isYearly) return t('cta.donateYearly');
    if (isMonthly) return t('cta.donateMonthly');
    return t('cta.donateNow');
  }, [donationData.frequency, makeMonthly, t]);

  return (
    <div className='space-y-6'>
      <Button
        className='w-full h-12 bg-gray-900 hover:bg-gray-700 text-white font-medium disabled:opacity-50'
        onClick={handleSubmit(onSubmit, errors => console.log(errors))}
      >
        <div className='font-semibold'>{buttonText}</div>
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

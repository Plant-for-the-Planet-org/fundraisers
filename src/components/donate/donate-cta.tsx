'use client';

import type { DonationFormValues } from './donation-form-context';

import { useTranslations } from 'next-intl';
import { useDonationForm } from './donation-form-context';
import { Button } from '../ui/button';
import { useFormContext, useWatch } from 'react-hook-form';

export function DonateCTA() {
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

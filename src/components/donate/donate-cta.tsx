'use client';

import type { DonationFormValues } from './donation-form-context';

import { useTranslations } from 'next-intl';
import { useDonationForm } from './donation-form-context';
import { Button } from '../ui/button';
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

  return (
    <div className='space-y-6'>
      <Button
        className='w-full h-12 bg-gray-900 hover:bg-gray-700 text-white font-medium disabled:opacity-50'
        onClick={handleSubmit(onSubmit)}
        disabled={isLoading || isSuccess}
      >
        {isLoading ? (
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
            {t('cta.processing')}
          </div>
        ) : isSuccess ? (
          <div className='flex items-center gap-2'>
            <svg className='w-4 h-4' viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            {t('cta.success')}
          </div>
        ) : (
          <div className='font-semibold'>{buttonText}</div>
        )}
      </Button>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import type { OnApproveData } from '@paypal/paypal-js';
import type { DonationFormValues } from './donation-form-context';

import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';
import { CheckIcon } from '../ui/check-icon';
import { Spinner } from '../ui/spinner';
import { useDonationForm } from './donation-form-context';
import { PayPalButton } from './paypal-button';

interface DonateCTAProps {
  isLoading: boolean;
  isSuccess: boolean;
  /** true when card/SEPA form fields are complete and have no inline errors */
  isPaymentFormReady: boolean;
  resetError: () => void;
  onPayPalCreateOrder?: (values: DonationFormValues) => Promise<string>;
  onPayPalApproved?: (data: OnApproveData) => Promise<void>;
  onPayPalError?: () => void;
}

export function DonateCTA({
  isLoading,
  isSuccess,
  isPaymentFormReady,
  resetError,
  onPayPalCreateOrder,
  onPayPalApproved,
  onPayPalError,
}: DonateCTAProps) {
  const t = useTranslations('Donate');
  const { donationData, onSubmit } = useDonationForm();
  const { handleSubmit } = useFormContext<DonationFormValues>();

  const selectedPaymentMethod = useWatch<
    DonationFormValues,
    'selectedPaymentMethod'
  >({
    name: 'selectedPaymentMethod',
  });

  const makeMonthly = useWatch<DonationFormValues, 'makeMonthly'>({
    name: 'makeMonthly',
  });

  // Clear submission error when user switches payment method
  const prevMethodRef = useRef(selectedPaymentMethod);
  useEffect(() => {
    if (
      prevMethodRef.current !== undefined &&
      prevMethodRef.current !== selectedPaymentMethod
    ) {
      resetError();
    }
    prevMethodRef.current = selectedPaymentMethod;
  }, [selectedPaymentMethod, resetError]);

  // Card/SEPA: disabled until form is complete and error-free
  // PayPal/bank_transfer/planet_cash: no inline form, always ready
  const needsFormReady =
    selectedPaymentMethod === 'card' || selectedPaymentMethod === 'sepa_debit';
  const isFormIncomplete = needsFormReady && !isPaymentFormReady;

  if (selectedPaymentMethod === 'paypal') {
    return (
      <PayPalButton
        isSuccess={isSuccess}
        onPayPalCreateOrder={onPayPalCreateOrder ?? (() => Promise.resolve(''))}
        onPayPalApproved={onPayPalApproved ?? (() => Promise.resolve())}
        onPayPalError={onPayPalError ?? (() => undefined)}
      />
    );
  }

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
        disabled={isLoading || isSuccess || isFormIncomplete}
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

'use client';

import type { ReactNode } from 'react';
import type { OnApproveData } from '@paypal/paypal-js';
import type { Stripe } from '@stripe/stripe-js';
import type { DonationFormValues } from './donation-form-context';
import type { WalletKind } from './wallet-button';

import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { scrollToFirstError } from '@/lib/utils/scroll-into-view';
import { Button } from '../ui/button';
import { CheckIcon } from '../ui/check-icon';
import { Spinner } from '../ui/spinner';
import { useDonationForm } from './donation-form-context';
import { PayPalButton } from './paypal-button';
import { WalletButton } from './wallet-button';

interface DonateCTAProps {
  isLoading: boolean;
  isSuccess: boolean;
  stripePromise?: Promise<Stripe | null> | null;
  resetError: () => void;
  onPayPalCreateOrder?: (values: DonationFormValues) => Promise<string>;
  onPayPalApproved?: (data: OnApproveData) => Promise<void>;
  onPayPalError?: () => void;
  onWalletConfirm?: (
    wallet: WalletKind,
    values: DonationFormValues,
    paymentMethodId: string,
    stripe: Stripe
  ) => Promise<void>;
  onWalletError?: () => void;
  onWalletCancel?: () => void;
}

export function DonateCTA({
  isLoading,
  isSuccess,
  stripePromise,
  resetError,
  onPayPalCreateOrder,
  onPayPalApproved,
  onPayPalError,
  onWalletConfirm,
  onWalletError,
  onWalletCancel,
}: DonateCTAProps) {
  const t = useTranslations('Donate');
  // TODO: onSubmit comes from DonationFormContext; wallet/PayPal callbacks come via props.
  // Consider moving all submission handlers to context for consistency.
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

  if (
    (selectedPaymentMethod === 'apple_pay' ||
      selectedPaymentMethod === 'google_pay') &&
    onWalletConfirm &&
    onWalletError &&
    onWalletCancel
  ) {
    return (
      <WalletButton
        wallet={selectedPaymentMethod}
        stripePromise={stripePromise ?? null}
        onWalletConfirm={onWalletConfirm}
        onWalletError={onWalletError}
        onWalletCancel={onWalletCancel}
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

  const handleClick = () => {
    handleSubmit(onSubmit, () => {
      requestAnimationFrame(() => {
        scrollToFirstError()?.focus?.();
      });
    })();
  };

  return (
    <div className='space-y-6'>
      <Button
        className='w-full h-12 bg-gray-900 hover:bg-gray-700 text-white font-medium disabled:opacity-50'
        onClick={handleClick}
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

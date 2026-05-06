'use client';

import type {
  Stripe,
  StripeElementsOptionsMode,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js';
import type { DonationFormValues } from './donation-form-context';

import { useCallback, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { getDonationProcessingFeeInfo } from '@/lib/utils/donation-payment-fees';
import { getStripe } from '@/lib/utils/get-stripe';
import { Skeleton } from '@/components/ui/skeleton';
import { useDonationForm } from './donation-form-context';

interface ApplePayButtonProps {
  onApplePayConfirm: (
    values: DonationFormValues,
    paymentMethodId: string,
    stripe: Stripe
  ) => Promise<void>;
}

/**
 * Apple Pay button rendered via Stripe's ExpressCheckoutElement.
 *
 * Uses its own inner <Elements> provider with `mode: 'payment'` so the
 * deferred-PaymentIntent flow is enabled — required by ExpressCheckoutElement.
 * The outer Elements provider in donate-overlay (no `mode`) keeps card/SEPA
 * flows on their existing token-first path.
 */
export function ApplePayButton({ onApplePayConfirm }: ApplePayButtonProps) {
  const locale = useLocale();
  const { fundraiser, paymentOptions, donationData } = useDonationForm();

  const coverFees = useWatch<DonationFormValues, 'coverFees'>({
    name: 'coverFees',
  });

  const stripeConfig = paymentOptions.gateways.stripe;
  const stripePromise = useMemo(
    () =>
      stripeConfig
        ? getStripe(stripeConfig.authorization.stripePublishableKey, locale)
        : null,
    [stripeConfig, locale]
  );

  const totalAmount = useMemo(() => {
    const { hasProcessingFee, processingFeeCents } =
      getDonationProcessingFeeInfo({
        paymentOptions,
        donationAmountCents: donationData.amount,
        donationCurrency: donationData.currency,
        workspaceCountry: fundraiser.workspace?.country,
        selectedPaymentMethod: 'apple-pay',
      });
    return (
      donationData.amount +
      (coverFees && hasProcessingFee ? processingFeeCents : 0)
    );
  }, [
    coverFees,
    donationData.amount,
    donationData.currency,
    fundraiser.workspace?.country,
    paymentOptions,
  ]);

  const elementsOptions: StripeElementsOptionsMode = useMemo(
    () => ({
      mode: 'payment',
      amount: totalAmount,
      currency: donationData.currency.toLowerCase(),
      paymentMethodCreation: 'manual',
      loader: 'auto',
    }),
    [totalAmount, donationData.currency]
  );

  if (!stripePromise) return null;

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <ApplePayButtonInner onApplePayConfirm={onApplePayConfirm} />
    </Elements>
  );
}

function ApplePayButtonInner({ onApplePayConfirm }: ApplePayButtonProps) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations('Donate.applePay');
  const { trigger, getValues } = useFormContext<DonationFormValues>();

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReady = useCallback(
    (event: StripeExpressCheckoutElementReadyEvent) => {
      setIsAvailable(Boolean(event.availablePaymentMethods?.applePay));
    },
    []
  );

  const handleClick = useCallback(
    async (event: StripeExpressCheckoutElementClickEvent) => {
      const isValid = await trigger();
      if (!isValid) return; // not calling resolve() halts the sheet
      event.resolve({
        emailRequired: false,
        phoneNumberRequired: false,
        shippingAddressRequired: false,
      });
    },
    [trigger]
  );

  const handleConfirm = useCallback(async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) return;

      const { paymentMethod, error } = await stripe.createPaymentMethod({
        elements,
      });
      if (error || !paymentMethod) return;

      await onApplePayConfirm(getValues(), paymentMethod.id, stripe);
    } finally {
      setIsProcessing(false);
    }
  }, [stripe, elements, getValues, onApplePayConfirm]);

  if (isAvailable === false) {
    return (
      <div className='border border-border rounded-lg p-4 text-sm text-muted-foreground'>
        {t('unavailable')}
      </div>
    );
  }

  const isLoading = isAvailable === null;

  return (
    <div className='space-y-2'>
      <div className='relative min-h-[48px]'>
        {isLoading && (
          <Skeleton className='absolute inset-0 h-12 w-full rounded-md' />
        )}
        <div style={isLoading ? { visibility: 'hidden' } : undefined}>
          <ExpressCheckoutElement
            options={{
              paymentMethods: {
                applePay: 'always',
                googlePay: 'never',
                link: 'never',
                paypal: 'never',
                amazonPay: 'never',
                klarna: 'never',
              },
              buttonType: { applePay: 'donate' },
              buttonHeight: 48,
            }}
            onReady={handleReady}
            onClick={handleClick}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
      {isProcessing && (
        <p className='text-center text-sm text-muted-foreground'>
          {t('processing')}
        </p>
      )}
    </div>
  );
}

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
  onApplePayError: () => void;
}

interface ApplePayButtonInnerProps extends ApplePayButtonProps {
  onAttemptComplete: () => void;
}

/**
 * Apple Pay button rendered via Stripe's ExpressCheckoutElement.
 *
 * Uses its own inner <Elements> provider with `mode: 'payment'` so the
 * deferred-PaymentIntent flow is enabled — required by ExpressCheckoutElement.
 * The outer Elements provider in donate-overlay (no `mode`) keeps card/SEPA
 * flows on their existing token-first path.
 */
export function ApplePayButton({
  onApplePayConfirm,
  onApplePayError,
}: ApplePayButtonProps) {
  const locale = useLocale();
  const { fundraiser, paymentOptions, donationData } = useDonationForm();

  const willAbsorbFee = useWatch<DonationFormValues, 'willAbsorbFee'>({
    name: 'willAbsorbFee',
  });

  // Stripe locks an Elements instance after the first `elements.submit()` +
  // `createPaymentMethod` cycle. Retrying on the same instance is undefined
  // behavior — including the side effect that the wallet sheet won't reopen,
  // so a second failure never fires `onConfirm` and the error banner can't
  // re-show. Bumping this counter in the inner component's confirm `finally`
  // re-keys <Elements> and gives every attempt a fresh instance.
  const [attemptKey, setAttemptKey] = useState(0);
  const bumpAttempt = useCallback(() => setAttemptKey(k => k + 1), []);

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
        donationAmountCents: donationData.amountCents,
        donationCurrency: donationData.currency,
        workspaceCountry: fundraiser.workspace?.country,
        selectedPaymentMethod: 'apple_pay',
      });
    return (
      donationData.amountCents +
      (willAbsorbFee && hasProcessingFee ? processingFeeCents : 0)
    );
  }, [
    willAbsorbFee,
    donationData.amountCents,
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
    <Elements
      key={attemptKey}
      stripe={stripePromise}
      options={elementsOptions}
    >
      <ApplePayButtonInner
        onApplePayConfirm={onApplePayConfirm}
        onApplePayError={onApplePayError}
        onAttemptComplete={bumpAttempt}
      />
    </Elements>
  );
}

function ApplePayButtonInner({
  onApplePayConfirm,
  onApplePayError,
  onAttemptComplete,
}: ApplePayButtonInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations('Donate.applePay');
  const {
    getValues,
    formState: { isValid },
  } = useFormContext<DonationFormValues>();

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReady = useCallback(
    (event: StripeExpressCheckoutElementReadyEvent) => {
      setIsAvailable(Boolean(event.availablePaymentMethods?.applePay));
    },
    []
  );

  const handleClick = useCallback(
    (event: StripeExpressCheckoutElementClickEvent) => {
      // Donor identity (name, email, address, TIN) is collected by our form
      // — it's required for the donation record and receipts regardless of
      // payment method — so Apple Pay doesn't need to collect any of it.
      event.resolve({
        emailRequired: false,
        phoneNumberRequired: false,
        shippingAddressRequired: false,
      });
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onApplePayError();
        return;
      }

      const { paymentMethod, error } = await stripe.createPaymentMethod({
        elements,
      });
      if (error || !paymentMethod) {
        onApplePayError();
        return;
      }

      await onApplePayConfirm(getValues(), paymentMethod.id, stripe);
    } finally {
      setIsProcessing(false);
      // Signal the parent to remount <Elements> so a retry uses a fresh
      // instance — see the comment on `attemptKey` in ApplePayButton.
      onAttemptComplete();
    }
  }, [
    stripe,
    elements,
    getValues,
    onApplePayConfirm,
    onApplePayError,
    onAttemptComplete,
  ]);

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
        <div
          className={
            !isValid
              ? 'opacity-50 pointer-events-none transition-opacity'
              : 'transition-opacity'
          }
          style={isLoading ? { visibility: 'hidden' } : undefined}
        >
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

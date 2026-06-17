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
import { useTranslations } from 'next-intl';
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { getDonationProcessingFeeInfo } from '@/lib/utils/donation-payment-fees';
import { Skeleton } from '@/components/ui/skeleton';
import { useDonationForm } from './donation-form-context';

export type WalletKind = 'apple_pay' | 'google_pay';

// Stripe SDK uses camelCase identifiers for its wallet APIs
// (`availablePaymentMethods`, `paymentMethods` config, `buttonType`).
// Internal payment-method ids stay snake_case to match the platform API.
const STRIPE_WALLET_KEY = {
  apple_pay: 'applePay',
  google_pay: 'googlePay',
} as const;

export interface WalletButtonProps {
  wallet: WalletKind;
  stripePromise: Promise<Stripe | null> | null;
  onWalletConfirm: (
    wallet: WalletKind,
    values: DonationFormValues,
    paymentMethodId: string,
    stripe: Stripe
  ) => Promise<void>;
  onWalletError: () => void;
  onWalletCancel: () => void;
}

interface WalletButtonInnerProps extends Omit<
  WalletButtonProps,
  'stripePromise'
> {
  onAttemptComplete: () => void;
}

/**
 * Renders Apple Pay or Google Pay via Stripe's ExpressCheckoutElement.
 *
 * Uses its own inner <Elements> provider with `mode: 'payment'` so the
 * deferred-PaymentIntent flow is enabled — required by ExpressCheckoutElement.
 * The outer Elements provider in donate-overlay (no `mode`) keeps card/SEPA
 * flows on their existing token-first path.
 */
export function WalletButton({
  wallet,
  stripePromise,
  onWalletConfirm,
  onWalletError,
  onWalletCancel,
}: WalletButtonProps) {
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

  // ExpressCheckoutElement's `paymentMethods` and `buttonType` options are
  // read-only after mount — and `availablePaymentMethods` in `onReady`
  // reflects only the wallets enabled at mount, not device capability alone.
  // So switching from Google Pay to Apple Pay (or vice versa) on the same
  // Elements instance leaves `availablePaymentMethods.applePay` stuck at
  // false. Including `wallet` in the key remounts <Elements> on wallet
  // change so each wallet gets a fresh availability check.
  const elementsKey = `${wallet}-${attemptKey}`;

  const totalAmount = useMemo(() => {
    const { hasProcessingFee, processingFeeCents } =
      getDonationProcessingFeeInfo({
        paymentOptions,
        donationAmountCents: donationData.amountCents,
        donationCurrency: donationData.currency,
        workspaceCountry: fundraiser.workspace?.country,
        selectedPaymentMethod: wallet,
      });
    return (
      donationData.amountCents +
      (willAbsorbFee && hasProcessingFee ? processingFeeCents : 0)
    );
  }, [
    wallet,
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
      key={elementsKey}
      stripe={stripePromise}
      options={elementsOptions}
    >
      <WalletButtonInner
        wallet={wallet}
        onWalletConfirm={onWalletConfirm}
        onWalletError={onWalletError}
        onWalletCancel={onWalletCancel}
        onAttemptComplete={bumpAttempt}
      />
    </Elements>
  );
}

function WalletButtonInner({
  wallet,
  onWalletConfirm,
  onWalletError,
  onWalletCancel,
  onAttemptComplete,
}: WalletButtonInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const tApple = useTranslations('Donate.applePay');
  const tGoogle = useTranslations('Donate.googlePay');
  const t = wallet === 'apple_pay' ? tApple : tGoogle;
  const stripeWalletKey = STRIPE_WALLET_KEY[wallet];
  const {
    getValues,
    formState: { isValid },
  } = useFormContext<DonationFormValues>();

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReady = useCallback(
    (event: StripeExpressCheckoutElementReadyEvent) => {
      setIsAvailable(Boolean(event.availablePaymentMethods?.[stripeWalletKey]));
    },
    [stripeWalletKey]
  );

  const handleClick = useCallback(
    (event: StripeExpressCheckoutElementClickEvent) => {
      // Donor identity (name, email, address, TIN) is collected by our form
      // — it's required for the donation record and receipts regardless of
      // payment method — so the wallet doesn't need to collect any of it.
      event.resolve({
        emailRequired: false,
        phoneNumberRequired: false,
        shippingAddressRequired: false,
      });
    },
    []
  );

  // Stripe treats wallet dismissal as a non-error (no onConfirm fires).
  // Route through onWalletCancel so donors see a neutral banner confirming
  // the donation didn't go through. Bump the attempt counter so the next
  // try gets a fresh Elements instance.
  const handleCancel = useCallback(() => {
    onWalletCancel();
    onAttemptComplete();
  }, [onWalletCancel, onAttemptComplete]);

  const handleConfirm = useCallback(async () => {
    if (!stripe || !elements || isProcessing) return;

    setIsProcessing(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onWalletError();
        return;
      }

      const { paymentMethod, error } = await stripe.createPaymentMethod({
        elements,
      });
      if (error || !paymentMethod) {
        onWalletError();
        return;
      }

      await onWalletConfirm(wallet, getValues(), paymentMethod.id, stripe);
    } finally {
      setIsProcessing(false);
      // Signal the parent to remount <Elements> so a retry uses a fresh
      // instance — see the comment on `attemptKey` in WalletButton.
      onAttemptComplete();
    }
  }, [
    wallet,
    stripe,
    elements,
    isProcessing,
    getValues,
    onWalletConfirm,
    onWalletError,
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
            !isValid || isProcessing
              ? 'opacity-50 pointer-events-none transition-opacity'
              : 'transition-opacity'
          }
          style={isLoading ? { visibility: 'hidden' } : undefined}
        >
          <ExpressCheckoutElement
            options={{
              paymentMethods: {
                applePay: wallet === 'apple_pay' ? 'always' : 'never',
                googlePay: wallet === 'google_pay' ? 'always' : 'never',
                link: 'never',
                paypal: 'never',
                amazonPay: 'never',
                klarna: 'never',
              },
              buttonType:
                wallet === 'apple_pay'
                  ? { applePay: 'donate' }
                  : { googlePay: 'donate' },
              buttonHeight: 48,
            }}
            onReady={handleReady}
            onClick={handleClick}
            onCancel={handleCancel}
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

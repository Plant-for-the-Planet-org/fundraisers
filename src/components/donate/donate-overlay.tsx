'use client';

import type { DonationFrequency } from '@/lib/types/donation';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { StripeCardFormHandle } from './stripe-card-form';
import type { StripeSepaFormHandle } from './stripe-sepa-form';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/utils/get-stripe';
import { DonateCTA } from './donate-cta';
import { DonateOverlayLayout } from './donate-overlay-layout';
import { DonateOverlaySkeleton } from './donate-overlay-skeleton';
import { DonationFailureBanner } from './donation-failure-banner';
import { DonationFormProvider } from './donation-form-context';
import { DonationSummary } from './donation-summary';
import { DonationThankYou } from './donation-thank-you';
import { DonorInfo } from './donor-info';
import { PaymentMethods } from './payment-methods';
import { useDonationSubmit } from './use-donation-submit';

export interface DonationData {
  amount: number;
  currency: string;
  frequency: DonationFrequency;
  dedicated: boolean;
}

interface DonateOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  donationData: DonationData | null;
  fundraiser: Fundraiser;
  paymentOptions: PaymentOptions;
}

export function DonateOverlay({
  isOpen,
  onClose,
  donationData,
  fundraiser,
  paymentOptions,
}: DonateOverlayProps) {
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isClient || !isOpen) return null;

  // Show skeleton while donation data is still being fetched
  if (!donationData) return <DonateOverlaySkeleton onClose={onClose} />;

  return (
    <DonateOverlayInner
      donationData={donationData}
      fundraiser={fundraiser}
      paymentOptions={paymentOptions}
      onClose={onClose}
      isOpen={isOpen}
    />
  );
}

/** Inner component rendered only when donationData is available, so hooks can depend on it safely */
function DonateOverlayInner({
  donationData,
  fundraiser,
  paymentOptions,
  onClose,
  isOpen,
}: {
  donationData: DonationData;
  fundraiser: Fundraiser;
  paymentOptions: PaymentOptions;
  onClose: () => void;
  isOpen: boolean;
}) {
  const locale = useLocale();
  const sepaFormRef = useRef<StripeSepaFormHandle>(null);
  const cardFormRef = useRef<StripeCardFormHandle>(null);

  const stripeConfig = paymentOptions.gateways.stripe;
  const stripePromise = stripeConfig
    ? getStripe(stripeConfig.authorization.stripePublishableKey, locale)
    : null;

  const {
    onSubmit,
    donationState,
    reset,
    onPayPalCreateOrder,
    onPayPalApproved,
    onPayPalError,
  } = useDonationSubmit(
    donationData,
    fundraiser,
    paymentOptions,
    sepaFormRef,
    cardFormRef
  );
  const { thankYouState, error, isLoading } = donationState;

  const leftColumn = thankYouState ? (
    <DonationThankYou
      thankYouState={thankYouState}
      fundraiserSlug={fundraiser.slug}
    />
  ) : (
    <>
      {error?.code && (
        <DonationFailureBanner errorCode={error.code} reset={reset} />
      )}
      <DonorInfo />
      <PaymentMethods />
    </>
  );

  const rightColumn = (
    <>
      <DonationSummary />
      {thankYouState === null && (
        <DonateCTA
          isLoading={isLoading}
          isSuccess={false}
          onPayPalCreateOrder={onPayPalCreateOrder}
          onPayPalApproved={onPayPalApproved}
          onPayPalError={onPayPalError}
        />
      )}
    </>
  );

  return createPortal(
    <Elements stripe={stripePromise}>
      <DonationFormProvider
        fundraiser={fundraiser}
        donationData={donationData}
        paymentOptions={paymentOptions}
        onSubmit={onSubmit}
        sepaFormRef={sepaFormRef}
        cardFormRef={cardFormRef}
        isOpen={isOpen}
      >
        <DonateOverlayLayout
          onClose={onClose}
          leftColumn={leftColumn}
          rightColumn={rightColumn}
        />
      </DonationFormProvider>
    </Elements>,
    document.body
  );
}

'use client';

import type { SentInvitationGift } from '@planet-sdk/common';
import type { DonationFrequency } from '@/lib/types/donation';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { StripeCardFormHandle } from './stripe-card-form';
import type { StripeSepaFormHandle } from './stripe-sepa-form';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from 'next-intl';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/utils/get-stripe';
import { sanitizeThankYouHtml } from '@/lib/utils/sanitize-html';
import { DonateCTA } from './donate-cta';
import { DonateOptions } from './donate-options';
import { DonateOverlayLayout } from './donate-overlay-layout';
import { DonateOverlaySkeleton } from './donate-overlay-skeleton';
import { DonationFailureBanner } from './donation-failure-banner';
import { DonationFormProvider } from './donation-form-context';
import { DonationSummary } from './donation-summary';
import { DonationThankYou } from './donation-thank-you';
import { DonorInfo } from './donor-info';
import { GiftSummary } from './gift-summary';
import { PaymentMethods } from './payment-methods';
import { useDonationSubmit } from './use-donation-submit';

export interface DonationData {
  amountCents: number;
  currency: string;
  frequency: DonationFrequency;
  dedicated: boolean;
  gift?: SentInvitationGift;
}

interface DonateOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  donationData: DonationData | null;
  fundraiser: Fundraiser;
  paymentOptions: PaymentOptions;
  /** `true` once `paymentOptions` reflects the user's auth state — see `usePaymentOptions`. */
  paymentOptionsReady: boolean;
}

export function DonateOverlay({
  isOpen,
  onClose,
  donationData,
  fundraiser,
  paymentOptions,
  paymentOptionsReady,
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
      paymentOptionsReady={paymentOptionsReady}
      onClose={onClose}
      isOpen={isOpen}
    />
  );
}

interface DonateOverlayInnerProps {
  donationData: DonationData;
  fundraiser: Fundraiser;
  paymentOptions: PaymentOptions;
  paymentOptionsReady: boolean;
  onClose: () => void;
  isOpen: boolean;
}

/** Inner component rendered only when donationData is available, so hooks can depend on it safely */
function DonateOverlayInner({
  donationData,
  fundraiser,
  paymentOptions,
  paymentOptionsReady,
  onClose,
  isOpen,
}: DonateOverlayInnerProps) {
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

  const errorBannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error?.code) {
      errorBannerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [error?.code]);

  const thankYouModule = fundraiser.settings?.modules?.thankYouNote;
  const hostMessageConfig = useMemo(() => {
    const message =
      thankYouModule?.enabled && thankYouModule?.message
        ? sanitizeThankYouHtml(thankYouModule.message)
        : null;
    return message ? { message, hosts: fundraiser.hosts ?? [] } : null;
  }, [thankYouModule, fundraiser.hosts]);

  const leftColumn = thankYouState ? (
    <DonationThankYou
      thankYouState={thankYouState}
      fundraiserSlug={fundraiser.slug}
      hostMessageConfig={hostMessageConfig}
    />
  ) : (
    <>
      {error?.code && (
        <div ref={errorBannerRef}>
          <DonationFailureBanner errorCode={error.code} reset={reset} />
        </div>
      )}
      <DonorInfo />
      <PaymentMethods />
    </>
  );

  const rightColumn = (
    <>
      <GiftSummary />
      <DonationSummary />
      {thankYouState === null && (
        <>
          <DonateOptions />
          <DonateCTA
            isLoading={isLoading}
            isSuccess={false}
            onPayPalCreateOrder={onPayPalCreateOrder}
            onPayPalApproved={onPayPalApproved}
            onPayPalError={onPayPalError}
          />
        </>
      )}
    </>
  );

  return createPortal(
    <Elements stripe={stripePromise}>
      <DonationFormProvider
        fundraiser={fundraiser}
        donationData={donationData}
        paymentOptions={paymentOptions}
        paymentOptionsReady={paymentOptionsReady}
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

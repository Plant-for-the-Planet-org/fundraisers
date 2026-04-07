'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { DonationFrequency } from '@/lib/types/donation';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DonateOverlayLayout } from './donate-overlay-layout';
import { DonateOverlaySkeleton } from './donate-overlay-skeleton';
import { DonorInfo } from './donor-info';
import { DonationSummary } from './donation-summary';
import { PaymentMethods } from './payment-methods';
import { DonateCTA } from './donate-cta';
import { DonationFormProvider } from './donation-form-context';
import { useDonationSubmit } from './use-donation-submit';
import { DonationThankYou } from './donation-thank-you';
import { DonationFailureBanner } from './donation-failure-banner';

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
  const mounted = typeof window !== 'undefined';

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

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
  const { onSubmit, donationState, reset } = useDonationSubmit(
    donationData,
    fundraiser,
    paymentOptions
  );
  const { thankYou, error, isLoading } = donationState;

  const leftColumn = thankYou ? (
    <DonationThankYou
      thankYou={thankYou}
      amountInCents={donationData.amount}
      currency={donationData.currency}
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

  const rightColumn = thankYou ? (
    <DonationSummary />
  ) : (
    <>
      <DonationSummary />
      <DonateCTA isLoading={isLoading} isSuccess={!!thankYou} />
    </>
  );

  return createPortal(
    <DonationFormProvider
      fundraiser={fundraiser}
      donationData={donationData}
      paymentOptions={paymentOptions}
      onSubmit={onSubmit}
      isOpen={isOpen}
    >
      <DonateOverlayLayout
        onClose={onClose}
        leftColumn={leftColumn}
        rightColumn={rightColumn}
      />
    </DonationFormProvider>,
    document.body
  );
}

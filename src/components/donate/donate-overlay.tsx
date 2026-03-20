'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { DonationFormValues } from './donation-form-context';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DonateOverlayLayout } from './donate-overlay-layout';
import { DonateOverlaySkeleton } from './donate-overlay-skeleton';
import { DonorInfo } from './donor-info';
import { DonationSummary } from './donation-summary';
import { PaymentMethods } from './payment-methods';
import { DonateCTA } from './donate-cta';
import { DonationFormProvider } from './donation-form-context';

export interface DonationData {
  amount: number;
  currency: string;
  frequency: string;
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

  function onSubmit(values: DonationFormValues) {
    // TODO (Portion 4): build payload and call useDonation.submitDonation
    console.log('donation form values', values);
  }

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
        leftColumn={
          <>
            {/* Error Message */}
            {/* Success Message */}
            <DonorInfo />
            {/* Custom Fields Section - future implementation */}
            <PaymentMethods />
          </>
        }
        rightColumn={
          <>
            {/* Dedication - future implementation */}
            <DonationSummary />
            <DonateCTA />
          </>
        }
      />
    </DonationFormProvider>,
    document.body
  );
}

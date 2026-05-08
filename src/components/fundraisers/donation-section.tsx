'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { DonationData } from '../donate/donate-overlay';

import { useState } from 'react';
import { mapPaymentOptionsToContributionSettings } from '@/lib/utils/contribution-utils';
import { DonateOverlay } from '../donate/donate-overlay';
import { usePaymentOptions } from '../donate/use-payment-options';
import { DonationForm } from './donation-form';

interface DonationSectionProps {
  fundraiser: Fundraiser;
  paymentOptions: PaymentOptions;
  paymentOptionsAreAuthenticated?: boolean;
}

export function DonationSection({
  fundraiser,
  paymentOptions,
  paymentOptionsAreAuthenticated = false,
}: DonationSectionProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [donationData, setDonationData] = useState<DonationData | null>(null);
  const {
    paymentOptions: resolvedPaymentOptions,
    isReady: paymentOptionsReady, // renamed for clarity when passed as a prop
  } = usePaymentOptions(fundraiser.id, {
    initialPaymentOptions: paymentOptions,
    fetchEnabled: isOverlayOpen,
    areInitialOptionsAuthenticated: paymentOptionsAreAuthenticated,
  });

  const contributionSettings = mapPaymentOptionsToContributionSettings(
    resolvedPaymentOptions,
    fundraiser.settings?.modules?.contribution
  );

  return (
    <>
      <DonationForm
        currency={fundraiser.currency}
        contributionSettings={contributionSettings}
        onDonate={(amountCents, isDedicated, frequency, gift) => {
          setDonationData({
            amountCents,
            currency: fundraiser.currency,
            frequency,
            dedicated: isDedicated,
            gift,
          });
          setIsOverlayOpen(true);
        }}
      />
      <DonateOverlay
        isOpen={isOverlayOpen}
        onClose={() => {
          setIsOverlayOpen(false);
          setDonationData(null);
        }}
        donationData={donationData}
        fundraiser={fundraiser}
        paymentOptions={resolvedPaymentOptions}
        paymentOptionsReady={paymentOptionsReady}
      />
    </>
  );
}

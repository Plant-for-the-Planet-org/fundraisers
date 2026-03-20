'use client';

import type { DonationData } from '../donate/donate-overlay';

import { useState } from 'react';
import { DonationForm } from './donation-form';
import { DonateOverlay } from '../donate/donate-overlay';
import { mapPaymentOptionsToContributionSettings } from '@/lib/utils/contribution-utils';
import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';

interface DonationSectionProps {
  fundraiser: Fundraiser;
  paymentOptions: PaymentOptions;
}

export function DonationSection({
  fundraiser,
  paymentOptions,
}: DonationSectionProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [donationData, setDonationData] = useState<DonationData | null>(null);

  const contributionSettings = mapPaymentOptionsToContributionSettings(
    paymentOptions,
    fundraiser.settings?.modules?.contribution
  );

  return (
    <>
      <DonationForm
        currency={fundraiser.currency}
        contributionSettings={contributionSettings}
        onDonate={(amount, isDedicated, frequency) => {
          setDonationData({
            amount,
            currency: fundraiser.currency,
            frequency,
            dedicated: isDedicated,
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
      />
    </>
  );
}

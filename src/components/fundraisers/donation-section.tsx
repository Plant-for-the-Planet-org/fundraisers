'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { PaymentOptions } from '@/lib/types/payment-options';
import type { DonationData } from '../donate/donate-overlay';

import { useState } from 'react';
import { mapPaymentOptionsToContributionSettings } from '@/lib/utils/contribution-utils';
import { DonateOverlay } from '../donate/donate-overlay';
import { DonationForm } from './donation-form';

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
        paymentOptions={paymentOptions}
      />
    </>
  );
}

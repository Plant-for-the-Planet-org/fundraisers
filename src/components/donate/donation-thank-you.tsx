'use client';

import type { ReactNode } from 'react';
import type { ShareGift } from '@/lib/share/share-data';
import type { DonationFrequency } from '@/lib/types/donation';
import type { ThankYouState } from '@/lib/types/donation-submit';
import type { Fundraiser, FundraiserHost } from '@/lib/types/fundraiser';
import type { SafeHtml } from '@/lib/types/safe-html';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { BankTransferDetails } from './bank-transfer-details';
import { HostMessageCard } from './host-message-card';
import { ShareSection } from './share-section';
import { ThankYouCard } from './thank-you-card';

// The API sends `frequency` as a plain string; any other value would put a raw message key on a public share image.
const SHARE_GIFT_FREQUENCIES: readonly DonationFrequency[] = [
  'once',
  'monthly',
  'yearly',
];

interface HostMessageConfig {
  message: SafeHtml;
  hosts: FundraiserHost[];
}

interface DonationThankYouProps {
  thankYouState: ThankYouState;
  fundraiser: Fundraiser;
  hostMessageConfig: HostMessageConfig | null;
}

export function DonationThankYou({
  thankYouState,
  fundraiser,
  hostMessageConfig,
}: DonationThankYouProps) {
  const locale = useLocale();
  // Only money that has moved: a pending bank transfer or a payment still processing gets no gift on the share image.
  const gift = useMemo<ShareGift | null>(
    () =>
      thankYouState.status === 'completed' &&
      thankYouState.amount > 0 &&
      thankYouState.currency &&
      SHARE_GIFT_FREQUENCIES.includes(thankYouState.frequency)
        ? {
            amount: thankYouState.amount,
            currency: thankYouState.currency,
            frequency: thankYouState.frequency,
          }
        : null,
    [thankYouState]
  );
  let card: ReactNode;
  let hostMessageCard: ReactNode = null;
  switch (thankYouState.status) {
    case 'bankTransferPending':
      card = (
        <ThankYouCard
          variant='bankTransferPending'
          frequency={thankYouState.frequency}
          formattedAmount={formatCurrencyFromDecimal(
            thankYouState.amount,
            thankYouState.currency,
            locale
          )}
        >
          <BankTransferDetails
            account={thankYouState.transferAccount}
            formattedAmount={formatCurrencyFromDecimal(
              thankYouState.amount,
              thankYouState.currency,
              locale,
              { currencyDisplay: 'code' }
            )}
            amount={thankYouState.amount}
            currency={thankYouState.currency}
            uid={thankYouState.uid}
          />
        </ThankYouCard>
      );
      break;
    case 'paymentProcessing':
      card = (
        <ThankYouCard
          variant='paymentProcessing'
          paymentResult={thankYouState.paymentResult}
        />
      );
      break;
    default:
      card = <ThankYouCard variant='completed' />;
      if (hostMessageConfig) {
        hostMessageCard = (
          <HostMessageCard
            hosts={hostMessageConfig.hosts}
            message={hostMessageConfig.message}
          />
        );
      }
  }

  return (
    <div className='mx-auto flex w-full max-w-lg flex-col gap-6'>
      {card}
      {hostMessageCard}
      <ShareSection fundraiser={fundraiser} gift={gift} />
    </div>
  );
}

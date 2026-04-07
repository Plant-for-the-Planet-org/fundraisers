'use client';

import type { ThankYouState } from '@/lib/types/donation-submit';
import type { DonationFrequency } from '@/lib/types/donation';

import { ThankYouCard } from './thank-you-card';
import { TransferDetailsList } from './transfer-details-list';
import { ShareSection } from './share-section';

interface DonationThankYouProps {
  thankYou: ThankYouState;
  amountInCents: number;
  currency: string;
  frequency: DonationFrequency;
  fundraiserSlug: string;
}

function formatTransferAmount(amountInCents: number, currency: string): string {
  const amount = amountInCents / 100;
  const formatted = amount % 1 !== 0 ? amount.toFixed(2) : String(amount);
  return `${currency.toUpperCase()} ${formatted}`;
}

export function DonationThankYou({
  thankYou,
  amountInCents,
  currency,
  frequency,
  fundraiserSlug,
}: DonationThankYouProps) {
  const amount = formatTransferAmount(amountInCents, currency);
  return (
    <div className='mx-auto flex w-full max-w-lg flex-col gap-6'>
      {thankYou.status === 'bankTransferPending' ? (
        <ThankYouCard
          variant='bankTransferPending'
          frequency={frequency}
          formattedAmount={amount}
        >
          <TransferDetailsList
            account={thankYou.transferAccount}
            formattedAmount={amount}
            donationId={thankYou.donationId}
            uid={thankYou.uid}
          />
        </ThankYouCard>
      ) : (
        <ThankYouCard variant='completed' />
      )}

      <ShareSection fundraiserSlug={fundraiserSlug} />
    </div>
  );
}

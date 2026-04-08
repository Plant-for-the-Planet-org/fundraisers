'use client';

import type { ThankYouState } from '@/lib/types/donation-submit';
import type { DonationFrequency } from '@/lib/types/donation';

import { ThankYouCard } from './thank-you-card';
import { TransferDetailsList } from './transfer-details-list';
import { ShareSection } from './share-section';

interface DonationThankYouProps {
  thankYouState: ThankYouState;
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
  thankYouState,
  amountInCents,
  currency,
  frequency,
  fundraiserSlug,
}: DonationThankYouProps) {
  const amount = formatTransferAmount(amountInCents, currency);
  return (
    <div className='mx-auto flex w-full max-w-lg flex-col gap-6'>
      {/* If we add more thank you states in the future, consider moving away from a ternary and using a switch  */}
      {thankYouState.status === 'bankTransferPending' ? (
        <ThankYouCard
          variant='bankTransferPending'
          frequency={frequency}
          formattedAmount={amount}
        >
          <TransferDetailsList
            account={thankYouState.transferAccount}
            formattedAmount={amount}
            donationId={thankYouState.donationId}
            uid={thankYouState.uid}
          />
        </ThankYouCard>
      ) : (
        <ThankYouCard variant='completed' />
      )}

      <ShareSection fundraiserSlug={fundraiserSlug} />
    </div>
  );
}

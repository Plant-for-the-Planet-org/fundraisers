'use client';

import type { ThankYouState } from '@/lib/types/donation-submit';

import { ThankYouCard } from './thank-you-card';
import { TransferDetailsList } from './transfer-details-list';
import { ShareSection } from './share-section';

interface DonationThankYouProps {
  thankYou: ThankYouState;
  amountInCents: number;
  currency: string;
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
  fundraiserSlug,
}: DonationThankYouProps) {
  return (
    <div className='mx-auto flex w-full max-w-lg flex-col gap-6'>
      {thankYou.status === 'bank_transfer_pending' ? (
        <ThankYouCard variant='bankTransferPending'>
          <TransferDetailsList
            account={thankYou.transferAccount}
            formattedAmount={formatTransferAmount(amountInCents, currency)}
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

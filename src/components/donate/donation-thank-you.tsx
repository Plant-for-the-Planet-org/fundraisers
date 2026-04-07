'use client';

import type { PaymentResponse } from '@/lib/types/payment';

import { ThankYouCard } from './thank-you-card';
import { TransferDetailsList } from './transfer-details-list';
import { ShareSection } from './share-section';

interface DonationThankYouProps {
  donationId: string | null;
  uid: string | null;
  transferDetails: PaymentResponse['response'] | null;
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
  donationId,
  uid,
  transferDetails,
  amountInCents,
  currency,
  fundraiserSlug,
}: DonationThankYouProps) {
  const isBankTransferPending = transferDetails?.type === 'transfer_required';

  return (
    <div className='mx-auto flex w-full max-w-lg flex-col gap-6'>
      <ThankYouCard>
        {isBankTransferPending && transferDetails && (
          <TransferDetailsList
            transferResponse={transferDetails}
            formattedAmount={formatTransferAmount(amountInCents, currency)}
            donationId={donationId}
            uid={uid}
          />
        )}
      </ThankYouCard>

      <ShareSection fundraiserSlug={fundraiserSlug} />
    </div>
  );
}

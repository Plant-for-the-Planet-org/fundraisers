'use client';

import type { ThankYouState } from '@/lib/types/donation-submit';

import { useLocale } from 'next-intl';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { ShareSection } from './share-section';
import { ThankYouCard } from './thank-you-card';
import { TransferDetailsList } from './transfer-details-list';

interface DonationThankYouProps {
  thankYouState: ThankYouState;
  fundraiserSlug: string;
}

export function DonationThankYou({
  thankYouState,
  fundraiserSlug,
}: DonationThankYouProps) {
  const locale = useLocale();
  return (
    <div className='mx-auto flex w-full max-w-lg flex-col gap-6'>
      {/* If we add more thank you states in the future, consider moving away from a ternary and using a switch  */}
      {thankYouState.status === 'bankTransferPending' ? (
        <ThankYouCard
          variant='bankTransferPending'
          frequency={thankYouState.frequency}
          formattedAmount={formatCurrencyFromDecimal(
            thankYouState.amount,
            thankYouState.currency,
            locale
          )}
        >
          <TransferDetailsList
            account={thankYouState.transferAccount}
            formattedAmount={formatCurrencyFromDecimal(
              thankYouState.amount,
              thankYouState.currency,
              locale,
              'code'
            )}
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

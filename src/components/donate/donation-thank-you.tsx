'use client';

import type { ReactNode } from 'react';
import type { ThankYouState } from '@/lib/types/donation-submit';

import { useLocale } from 'next-intl';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { BankTransferDetails } from './bank-transfer-details';
import { ShareSection } from './share-section';
import { ThankYouCard } from './thank-you-card';

interface DonationThankYouProps {
  thankYouState: ThankYouState;
  fundraiserSlug: string;
}

export function DonationThankYou({
  thankYouState,
  fundraiserSlug,
}: DonationThankYouProps) {
  const locale = useLocale();
  let card: ReactNode;
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
  }

  return (
    <div className='mx-auto flex w-full max-w-lg flex-col gap-6'>
      {card}
      <ShareSection fundraiserSlug={fundraiserSlug} />
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useDonationForm } from './donation-form-context';

export function GiftSummary() {
  const { donationData } = useDonationForm();

  if (!donationData.dedicated || !donationData.gift) return null;

  return <GiftSummaryInner />;
}

function GiftSummaryInner() {
  const { donationData } = useDonationForm();
  const t = useTranslations('Fundraisers.create.contributionSettings.gift');
  const gift = donationData.gift!;

  return (
    <div className='gift-summary space-y-1 rounded-md border border-border p-3 text-sm'>
      <p className='font-semibold text-foreground'>{t('sectionTitle')}</p>
      <p className='text-muted-foreground'>
        {t('recipientName.label')}: {gift.recipientName}
      </p>
      {gift.recipientEmail && (
        <p className='text-muted-foreground'>
          {t('recipientEmail.label')}: {gift.recipientEmail}
        </p>
      )}
      {gift.message && (
        <p className='text-muted-foreground'>
          {t('message.label')}: {gift.message}
        </p>
      )}
    </div>
  );
}

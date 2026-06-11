'use client';

import type { FundraiserFormValues } from './fundraiser-form-schema';

import { useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { DonorsStrip } from './donors-strip';
import { getMockLeaderboardDonations } from './leaderboard/mock-data';
import { SectionHeader } from './typography';

export function DonorsPreview() {
  const t = useTranslations('Fundraisers');
  const locale = useLocale();
  const currency = useWatch<FundraiserFormValues, 'currency'>({
    name: 'currency',
  });
  const { recent } = getMockLeaderboardDonations(currency);

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader
        className='flex-row items-center justify-between'
        actionSlot={
          <span className='text-xs text-muted-foreground'>{t('demoData')}</span>
        }
      >
        {t('donationCount', {
          count: recent.length,
          formattedCount: recent.length.toLocaleString(locale),
        })}
      </SectionHeader>
      <DonorsStrip donations={recent} donationCount={recent.length} />
    </div>
  );
}

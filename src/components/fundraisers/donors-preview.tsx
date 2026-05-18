'use client';

import type { FundraiserFormValues } from './fundraiser-form-schema';

import { useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { getMockLeaderboardDonations } from './leaderboard/mock-data';
import { DonorsStrip } from './donors-strip';
import { SectionHeader } from './typography';

export function DonorsPreview() {
  const t = useTranslations('Fundraisers');
  const currency = useWatch<FundraiserFormValues, 'currency'>({
    name: 'currency',
  });
  const { recent } = getMockLeaderboardDonations(currency);

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>
        {t('donationCount', {
          count: recent.length,
          formattedCount: recent.length.toLocaleString(),
        })}
      </SectionHeader>
      <DonorsStrip donations={recent} donationCount={recent.length} />
    </div>
  );
}

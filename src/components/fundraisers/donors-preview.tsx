'use client';

import type { FundraiserFormValues } from './fundraiser-form-schema';

import { useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { DonorsStrip, DonorsStripSkeleton } from './donors-strip';
import { useEditLeaderboard } from './leaderboard/edit-leaderboard-context';
import { getMockLeaderboardDonations } from './leaderboard/mock-data';
import { SectionHeader } from './typography';

export function DonorsPreview() {
  const t = useTranslations('Fundraisers');
  const locale = useLocale();
  const currency = useWatch<FundraiserFormValues, 'currency'>({
    name: 'currency',
  });
  // In edit mode this holds the fundraiser's real leaderboard data; null in create mode.
  const editLeaderboard = useEditLeaderboard();

  if (editLeaderboard?.isLoading) {
    return (
      <div className='flex flex-col gap-3'>
        <Skeleton className='h-5 w-32' />
        <DonorsStripSkeleton />
      </div>
    );
  }

  // Use real donations when the fundraiser has any; otherwise fall back to mocks
  // (create mode, an unfunded fundraiser, or a failed fetch).
  const realData = editLeaderboard?.hasRealDonations ? editLeaderboard : null;
  const donations = realData
    ? realData.recent
    : getMockLeaderboardDonations(currency).recent;
  const donationCount = realData ? realData.donationCount : donations.length;

  return (
    <div className='flex flex-col gap-3'>
      <SectionHeader>
        {t('donationCount', {
          count: donationCount,
          formattedCount: donationCount.toLocaleString(locale),
        })}
      </SectionHeader>
      <DonorsStrip donations={donations} donationCount={donationCount} />
    </div>
  );
}

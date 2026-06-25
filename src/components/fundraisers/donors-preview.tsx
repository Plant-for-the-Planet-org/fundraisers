'use client';

import type { FundraiserFormValues } from './fundraiser-form-schema';

import { useWatch } from 'react-hook-form';
import { DonorsSummaryPanel } from './donors-summary-panel';
import { getMockLeaderboardDonations } from './leaderboard/mock-data';

export function DonorsPreview() {
  const currency = useWatch<FundraiserFormValues, 'currency'>({
    name: 'currency',
  });
  const settings = useWatch<
    FundraiserFormValues,
    'settings.modules.leaderboard'
  >({ name: 'settings.modules.leaderboard' });

  const { recent, top } = getMockLeaderboardDonations(currency);
  const donations = settings.show_top_list && top.length > 0 ? top : recent;

  return (
    <DonorsSummaryPanel
      donations={donations}
      donationCount={donations.length}
      settings={settings}
      // Empty idOrSlug + totals equal to the mock lengths keep the overlay's
      // pagination from hitting the network in the demo preview.
      idOrSlug=''
      initialRecentDonations={recent}
      initialTopDonations={top}
      totalRecentDonationCount={recent.length}
      totalTopDonationCount={top.length}
      demo
    />
  );
}

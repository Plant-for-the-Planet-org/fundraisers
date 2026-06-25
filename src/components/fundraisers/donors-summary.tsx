import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { getLeaderboardWithRetry } from '@/lib/api/leaderboard-service';
import { DonorsSummaryPanel } from './donors-summary-panel';

interface DonorsSummaryProps {
  fundraiser: Fundraiser;
}

export async function DonorsSummary({ fundraiser }: DonorsSummaryProps) {
  let data: LeaderboardApiResponse | null = null;
  try {
    data = await getLeaderboardWithRetry(fundraiser.slug);
  } catch {
    // Leaderboard endpoint unavailable; fall through to the count-only header.
    data = null;
  }

  if (!data) {
    // Keep the count header visible (no strip, no view-all) rather than a stale
    // or partial summary.
    const settings = fundraiser.settings?.modules?.leaderboard;
    if (!settings) return null;

    return (
      <DonorsSummaryPanel
        donations={[]}
        donationCount={fundraiser.donationCount}
        settings={{ ...settings, view_all: false }}
        idOrSlug={fundraiser.slug}
        initialRecentDonations={[]}
        initialTopDonations={[]}
        totalRecentDonationCount={0}
        totalTopDonationCount={0}
      />
    );
  }

  // Prefer top donors (often pre-aggregated by donor on the backend); fall back
  // to recent if top is empty.
  const donations = data.top.length > 0 ? data.top : data.recent;

  return (
    <DonorsSummaryPanel
      donations={donations}
      donationCount={data.donationCount}
      settings={fundraiser.settings?.modules?.leaderboard ?? data.settings}
      idOrSlug={fundraiser.slug}
      initialRecentDonations={data.recent}
      initialTopDonations={data.top}
      totalRecentDonationCount={data.recentTotal}
      totalTopDonationCount={data.topTotal}
    />
  );
}

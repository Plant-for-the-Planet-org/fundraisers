import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { getLeaderboardWithRetry } from '@/lib/api/leaderboard-service';
import { DonorsStrip, DonorsStripSkeleton } from './donors-strip';

interface DonorsSummaryProps {
  fundraiser: Fundraiser;
}

export async function DonorsSummary({ fundraiser }: DonorsSummaryProps) {
  let donations: LeaderboardDonation[] = [];
  let donationCount = fundraiser.donationCount;
  try {
    const data = await getLeaderboardWithRetry(fundraiser.slug);
    // Prefer top donors (often pre-aggregated by donor on the backend);
    // fall back to recent if top is empty.
    donations = data.top.length > 0 ? data.top : data.recent;
    donationCount = data.donationCount;
  } catch {
    // Leaderboard endpoint unavailable; render nothing rather than a
    // stale or partial strip. The count text above stays visible.
  }

  // No donations to render (zero donations, empty backend response, or fetch
  // failed). Keep the skeleton visible so the layout below the count header
  // stays stable instead of collapsing.
  if (donations.length === 0) {
    return <DonorsStripSkeleton />;
  }

  return <DonorsStrip donations={donations} donationCount={donationCount} />;
}

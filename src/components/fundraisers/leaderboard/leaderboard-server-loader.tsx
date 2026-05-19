import type { LeaderboardModuleSettings } from '@/lib/types/fundraiser';

import { getLeaderboardWithRetry } from '@/lib/api/leaderboard-service';
import { LeaderboardView } from './leaderboard-view';

interface LeaderboardServerLoaderProps {
  idOrSlug: string;
  settings: LeaderboardModuleSettings;
}

export async function LeaderboardServerLoader({
  idOrSlug,
  settings,
}: LeaderboardServerLoaderProps) {
  let data;
  try {
    data = await getLeaderboardWithRetry(idOrSlug);
  } catch {
    return null;
  }

  return (
    <LeaderboardView
      idOrSlug={idOrSlug}
      initialRecentDonations={data.recent}
      initialTopDonations={data.top}
      totalRecentDonationCount={data.recentTotal}
      totalTopDonationCount={data.topTotal}
      settings={settings}
    />
  );
}

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { getLeaderboard } from '@/lib/api/leaderboard-service';
import { SHARE_LEADERBOARD_LIMIT, showsShareDonors } from '../share-data';

import 'server-only';

/**
 * The leaderboard behind the link preview's donor row, for its version and its render.
 * Null when the banner shows no donor row, and then nothing is loaded. It tries twice, then throws.
 */
export async function loadShareLeaderboard(
  fundraiser: Fundraiser
): Promise<LeaderboardApiResponse | null> {
  if (!showsShareDonors(fundraiser)) return null;
  const load = () =>
    getLeaderboard(fundraiser.slug || fundraiser.id, SHARE_LEADERBOARD_LIMIT);
  return load().catch(load);
}

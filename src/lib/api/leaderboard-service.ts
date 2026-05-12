import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { platformAPIClient } from './external-client';

export async function getLeaderboard(
  idOrSlug: string
): Promise<LeaderboardApiResponse> {
  return platformAPIClient.get<LeaderboardApiResponse>(
    `/fundraisers/${encodeURIComponent(idOrSlug)}/leaderboard`
  );
}

export async function getLeaderboardWithRetry(
  idOrSlug: string,
  maxRetries: number = 2
): Promise<LeaderboardApiResponse> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await getLeaderboard(idOrSlug);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (attempt === maxRetries) break;
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  throw lastError!;
}

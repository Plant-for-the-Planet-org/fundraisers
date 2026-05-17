import type {
  LeaderboardApiResponse,
  LeaderboardPageResponse,
} from '@/lib/types/leaderboard';

import { platformFetch } from './platform-fetch';

export async function getLeaderboard(
  idOrSlug: string,
  limit: number = 10
): Promise<LeaderboardApiResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  return platformFetch<LeaderboardApiResponse>(
    `/fundraisers/${encodeURIComponent(idOrSlug)}/leaderboard?${params.toString()}`
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

export async function getLeaderboardByTab(
  idOrSlug: string,
  tab: 'recent' | 'top',
  page: number = 1,
  limit: number = 10
): Promise<LeaderboardPageResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  return platformFetch<LeaderboardPageResponse>(
    `/fundraisers/${idOrSlug}/leaderboard/${tab}?${params.toString()}`
  );
}

import type {
  LeaderboardApiResponse,
  LeaderboardPageResponse,
} from '@/lib/types/leaderboard';

import { cache } from 'react';
import { platformFetch } from './platform-fetch';
import { withRetry } from './utils';

export async function getLeaderboard(
  idOrSlug: string,
  limit: number = 10
): Promise<LeaderboardApiResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  return platformFetch<LeaderboardApiResponse>(
    `/fundraisers/${encodeURIComponent(idOrSlug)}/leaderboard?${params.toString()}`
  );
}

export const getLeaderboardWithRetry = cache(
  async (
    idOrSlug: string,
    maxRetries: number = 2
  ): Promise<LeaderboardApiResponse> => {
    return withRetry(() => getLeaderboard(idOrSlug), maxRetries);
  }
);

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
    `/fundraisers/${encodeURIComponent(idOrSlug)}/leaderboard/${tab}?${params.toString()}`
  );
}

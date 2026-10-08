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

/**
 * The leaderboard as the fundraiser's own hosts see it: both lists and every count, whatever the host chose to show the public.
 * Login required, never cached, and answered for any active host. The public `getLeaderboard` follows the host's settings instead.
 */
export async function getHostLeaderboard(
  guid: string,
  token: string,
  limit: number = 10
): Promise<LeaderboardApiResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  return platformFetch<LeaderboardApiResponse>(
    `/profile/fundraisers/${encodeURIComponent(guid)}/leaderboard?${params.toString()}`,
    { token }
  );
}

/** Every donation (`recent`) or donor (`top`), page by page, as the fundraiser's own hosts see them. See `getHostLeaderboard`. */
export async function getHostLeaderboardByTab(
  guid: string,
  tab: 'recent' | 'top',
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<LeaderboardPageResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  return platformFetch<LeaderboardPageResponse>(
    `/profile/fundraisers/${encodeURIComponent(guid)}/leaderboard/${tab}?${params.toString()}`,
    { token }
  );
}

'use client';

import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { useEffect, useState } from 'react';
import { getLeaderboard } from '@/lib/api/leaderboard-service';

interface LeaderboardSummaryState {
  data: LeaderboardApiResponse | null;
  isLoading: boolean;
}

/** Donor count and the latest donations. This is the public leaderboard feed, so anonymous donors are already masked by the platform. */
export function useLeaderboardSummary(
  id: string,
  limit: number
): LeaderboardSummaryState {
  const [state, setState] = useState<LeaderboardSummaryState>({
    data: null,
    isLoading: true,
  });

  useEffect(() => {
    let ignore = false;

    getLeaderboard(id, limit)
      .then(data => {
        if (!ignore) setState({ data, isLoading: false });
      })
      .catch(error => {
        console.error('[FundraiserDetail] Failed to load leaderboard:', error);
        if (!ignore) setState({ data: null, isLoading: false });
      });

    return () => {
      ignore = true;
    };
  }, [id, limit]);

  return state;
}

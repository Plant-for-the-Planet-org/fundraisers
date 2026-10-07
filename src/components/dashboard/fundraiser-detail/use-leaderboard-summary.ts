'use client';

import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { useEffect, useState } from 'react';
import { getHostLeaderboard } from '@/lib/api/leaderboard-service';
import { useAuthStore } from '@/stores/auth-store';

interface LeaderboardSummaryState {
  data: LeaderboardApiResponse | null;
  isLoading: boolean;
}

/** Donor count and the latest donations, from the host route: every count, whatever the host chose to show the public. Anonymous donors are still masked by the platform. */
export function useLeaderboardSummary(
  id: string,
  limit: number
): LeaderboardSummaryState {
  const [state, setState] = useState<LeaderboardSummaryState>({
    data: null,
    isLoading: true,
  });

  const accessToken = useAuthStore(s => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    let ignore = false;

    getHostLeaderboard(id, accessToken, limit)
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
  }, [id, limit, accessToken]);

  return state;
}

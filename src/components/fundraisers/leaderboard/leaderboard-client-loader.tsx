'use client';

import type { LeaderboardModuleSettings } from '@/lib/types/fundraiser';
import type { LeaderboardApiResponse } from '@/lib/types/leaderboard';

import { useEffect, useRef, useState } from 'react';
import { getLeaderboard } from '@/lib/api/leaderboard-service';
import { LeaderboardSkeleton } from './leaderboard-loader';
import { LeaderboardView } from './leaderboard-view';

interface LeaderboardClientLoaderProps {
  idOrSlug: string;
  settings: LeaderboardModuleSettings;
}

/**
 * Client-side leaderboard loader used when the page is rendered through
 * the FundraiserAuthRetry path (private/auth-required fundraisers).
 *
 * Unlike the server-side LeaderboardLoader, this fetches exactly once
 * using a ref guard to prevent re-fetching on parent re-renders.
 * No retry logic - a failed fetch degrades gracefully to showing nothing.
 */
export function LeaderboardClientLoader({
  idOrSlug,
  settings,
}: LeaderboardClientLoaderProps) {
  const [data, setData] = useState<LeaderboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    getLeaderboard(idOrSlug)
      .then(setData)
      .catch(() => {
        // Swallow error - leaderboard section won't render
      })
      .finally(() => setIsLoading(false));
  }, [idOrSlug]);

  if (isLoading) return <LeaderboardSkeleton />;
  if (!data) return null;

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

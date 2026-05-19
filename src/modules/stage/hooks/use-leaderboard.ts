'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useEffect, useState } from 'react';
import { platformFetch } from '@/lib/api/platform-fetch';
import {
  msUntilNextBucket,
  STAGE_POLL_INTERVAL_MS,
  stageHash,
} from '../stage-hash';

interface LeaderboardData {
  recent: LeaderboardDonation[];
  top: LeaderboardDonation[];
}

async function fetchLeaderboard(slug: string): Promise<LeaderboardData> {
  return platformFetch<LeaderboardData>(
    `/fundraisers/${slug}/leaderboard?stagehash=${stageHash()}`
  );
}

export function useLeaderboard(slug: string) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const result = await fetchLeaderboard(slug);
        if (!cancelled) {
          setData(result);
          setOffline(false);
        }
      } catch {
        if (!cancelled) setOffline(true);
      }
    }

    poll();
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      poll();
      intervalId = setInterval(poll, STAGE_POLL_INTERVAL_MS);
    }, msUntilNextBucket());
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [slug]);

  return { data, offline };
}

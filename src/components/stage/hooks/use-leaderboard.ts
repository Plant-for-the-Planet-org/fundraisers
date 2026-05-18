'use client';

import type { LeaderboardDonation } from '@/lib/types/leaderboard';

import { useEffect, useState } from 'react';
import { platformFetch } from '@/lib/api/platform-fetch';
import { stageHash } from './use-alltime-stats';

interface LeaderboardData {
  recent: LeaderboardDonation[];
  top: LeaderboardDonation[];
}

const POLL_INTERVAL = 15_000;

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
    const id = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [slug]);

  return { data, offline };
}

'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/constants/app-config';
import { stageHash } from './use-alltime-stats';

export interface DonationEntry {
  id: string;
  amount: number;
  currency: string;
  donorName: string;
  created: string;
  avatarUrl: string | null;
  isAnonymous: boolean;
}

interface LeaderboardData {
  recent: DonationEntry[];
  top: DonationEntry[];
}

const POLL_INTERVAL = 15_000;

async function fetchLeaderboard(slug: string): Promise<LeaderboardData> {
  const res = await fetch(
    `${API_BASE_URL}/fundraisers/${slug}/leaderboard?stagehash=${stageHash()}`,
    { headers: { 'X-SESSION-ID': 'web-client' } }
  );
  if (!res.ok) throw new Error(`leaderboard ${res.status}`);
  return res.json() as Promise<LeaderboardData>;
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

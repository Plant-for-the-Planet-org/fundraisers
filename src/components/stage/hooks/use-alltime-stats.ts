'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/constants/app-config';

const POLL_INTERVAL = 15_000;

export interface AlltimeStats {
  stats: {
    donationCount: number;
    goal: { amount: number; currency: string };
    daysLeft: number;
    raised: { total: number; currency: string };
    impact: {
      trees: number;
      conservedM2: number;
      restoredM2: number;
      funding: number;
    };
    lastUpdated: string;
  };
  settings: {
    enabled: boolean;
    show_goal: boolean;
    show_days_left: boolean;
    show_impact: boolean;
  };
}

export function stageHash() {
  return Math.floor(Date.now() / 15_000);
}

async function fetchAlltimeStats(slug: string): Promise<AlltimeStats> {
  const res = await fetch(
    `${API_BASE_URL}/fundraisers/${slug}/alltime-stats?stagehash=${stageHash()}`,
    { headers: { 'X-SESSION-ID': 'web-client' } }
  );
  if (!res.ok) throw new Error(`alltime-stats ${res.status}`);
  return res.json() as Promise<AlltimeStats>;
}

export function useAlltimeStats(slug: string) {
  const [data, setData] = useState<AlltimeStats | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const result = await fetchAlltimeStats(slug);
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

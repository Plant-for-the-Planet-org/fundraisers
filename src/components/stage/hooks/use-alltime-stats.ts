'use client';

import { useEffect, useState } from 'react';
import { platformFetch } from '@/lib/api/platform-fetch';
import {
  msUntilNextBucket,
  STAGE_POLL_INTERVAL_MS,
  stageHash,
} from '../stage-hash';

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

async function fetchAlltimeStats(slug: string): Promise<AlltimeStats> {
  return platformFetch<AlltimeStats>(
    `/fundraisers/${slug}/alltime-stats?stagehash=${stageHash()}`
  );
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

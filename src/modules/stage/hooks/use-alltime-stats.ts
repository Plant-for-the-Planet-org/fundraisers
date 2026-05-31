'use client';

import type { AlltimeStats } from '@/lib/types/alltime-stats';

import { useEffect, useState } from 'react';
import { getAlltimeStats } from '@/lib/api/fundraiser-service';
import {
  msUntilNextBucket,
  STAGE_POLL_INTERVAL_MS,
  stageHash,
} from '../stage-hash';

export function useAlltimeStats(slug: string) {
  const [data, setData] = useState<AlltimeStats | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const result = await getAlltimeStats(slug, { cacheBuster: stageHash() });
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

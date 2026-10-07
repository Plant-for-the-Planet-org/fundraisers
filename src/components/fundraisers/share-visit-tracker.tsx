'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/track';
import { readRefParam } from '@/lib/share/referral';

const WAIT_STEP_MS = 500;
const MAX_WAIT_STEPS = 20;

/**
 * Records a visit that came through someone's personal share link, so the host's Insights can show whose shares bring people.
 * Only the code is sent, never who the visitor is. The Umami script loads after the page, so this waits a few seconds for it.
 */
export function ShareVisitTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const ref = readRefParam(window.location.search);
    if (!ref) return;
    let steps = 0;
    const timer = setInterval(() => {
      steps++;
      if (window.umami) {
        trackEvent('share_visit', { fundraiser: slug, ref });
        clearInterval(timer);
      } else if (steps >= MAX_WAIT_STEPS) clearInterval(timer);
    }, WAIT_STEP_MS);
    return () => clearInterval(timer);
  }, [slug]);
  return null;
}

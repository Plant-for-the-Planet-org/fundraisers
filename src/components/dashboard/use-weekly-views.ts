'use client';

import { useEffect, useState } from 'react';
import {
  getActiveImpersonation,
  impersonationHeaders,
} from '@/lib/api/platform-fetch';
import { useAuthStore } from '@/stores/auth-store';

export interface WeeklyViews {
  views: number;
  previousViews: number;
}

/** Views this week across the host's fundraisers. Null while loading, when Umami is not set up, or when the call fails. */
export function useWeeklyViews(enabled: boolean): WeeklyViews | null {
  const accessToken = useAuthStore(state => state.accessToken);
  // Tagged with the token it was fetched for, so an account switch never shows the last account's number.
  const [views, setViews] = useState<{
    accessToken: string;
    data: WeeklyViews;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !accessToken) return;
    let ignore = false;

    fetch('/api/insights/summary', {
      // Our route checks hosting on the server, which cannot see the impersonation in localStorage, so it is sent along.
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...impersonationHeaders(getActiveImpersonation()),
      },
    })
      .then(async response => {
        if (!response.ok) return;
        const data = (await response.json()) as WeeklyViews;
        if (!ignore) setViews({ accessToken, data });
      })
      .catch(() => {
        // An optional number; nothing to tell the host if it is missing.
      });

    return () => {
      ignore = true;
    };
  }, [enabled, accessToken]);

  if (!enabled || views?.accessToken !== accessToken) return null;
  return views.data;
}

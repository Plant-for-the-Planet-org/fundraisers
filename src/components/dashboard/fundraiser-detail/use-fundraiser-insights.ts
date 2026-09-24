'use client';

import type {
  FundraiserInsights,
  InsightsRange,
} from '@/lib/types/fundraiser-insights';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export type InsightsState =
  | { status: 'loading' }
  | { status: 'ready'; data: FundraiserInsights }
  | { status: 'error' };

export function useFundraiserInsights(
  slug: string,
  range: InsightsRange,
  /** Bump to fetch again after an error. */
  attempt = 0
): InsightsState {
  const accessToken = useAuthStore(state => state.accessToken);
  const [state, setState] = useState<InsightsState>({ status: 'loading' });

  useEffect(() => {
    if (!accessToken) return;
    let ignore = false;

    const params = new URLSearchParams({
      range,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    // Loading shows again when the range changes, so the chart never pairs old bars with a new label.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading' });

    fetch(`/api/fundraisers/${encodeURIComponent(slug)}/insights?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async response => {
        if (ignore) return;
        if (!response.ok) {
          setState({ status: 'error' });
          return;
        }
        setState({
          status: 'ready',
          data: (await response.json()) as FundraiserInsights,
        });
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error' });
      });

    return () => {
      ignore = true;
    };
  }, [slug, range, accessToken, attempt]);

  return state;
}

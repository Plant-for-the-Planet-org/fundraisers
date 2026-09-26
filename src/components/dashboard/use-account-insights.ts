'use client';

import type {
  AccountInsights,
  InsightsRange,
} from '@/lib/types/fundraiser-insights';

import { useEffect, useState } from 'react';
import {
  getActiveImpersonation,
  impersonationHeaders,
} from '@/lib/api/platform-fetch';
import { useAuthStore } from '@/stores/auth-store';

export type AccountInsightsState =
  | { status: 'loading' }
  | { status: 'ready'; data: AccountInsights }
  | { status: 'error' };

export function useAccountInsights(
  range: Exclude<InsightsRange, 'campaign'>,
  /** Bump to fetch again after an error. */
  attempt = 0
): AccountInsightsState {
  const accessToken = useAuthStore(state => state.accessToken);
  const [state, setState] = useState<AccountInsightsState>({
    status: 'loading',
  });

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

    fetch(`/api/insights/account?${params}`, {
      // Our route checks hosting on the server, which cannot see the impersonation in localStorage, so it is sent along.
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...impersonationHeaders(getActiveImpersonation()),
      },
    })
      .then(async response => {
        if (ignore) return;
        if (!response.ok) {
          setState({ status: 'error' });
          return;
        }
        const data = (await response.json()) as AccountInsights;
        // Checked again: the range can change while the body is still being read.
        if (ignore) return;
        setState({ status: 'ready', data });
      })
      .catch(() => {
        if (!ignore) setState({ status: 'error' });
      });

    return () => {
      ignore = true;
    };
  }, [range, accessToken, attempt]);

  return state;
}

'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useEffect, useState } from 'react';
import { getHostFundraiserBySlug } from '@/lib/api/fundraiser-service';
import { PlatformAPIError } from '@/lib/api/platform-fetch';
import { isFundraiserOwnerOrAdmin } from '@/lib/utils/fundraiser';
import { useAuthStore } from '@/stores/auth-store';

export type HostedFundraiserState =
  | { status: 'loading' }
  | { status: 'ready'; fundraiser: Fundraiser; canEdit: boolean }
  | { status: 'not-found' }
  | { status: 'unauthorized' }
  | { status: 'error' };

/**
 * Loads a fundraiser for its dashboard pages. Every active host may look, including view-only co-hosts; only owners and admins get `canEdit`.
 *
 * Reads the host route, which answers only an active host of the fundraiser and carries every figure and every host, whatever the host chose to show the public.
 */
export function useHostedFundraiser(slug: string): HostedFundraiserState {
  const accessToken = useAuthStore(state => state.accessToken);
  const userId = useAuthStore(state => state.user?.sub);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const [state, setState] = useState<HostedFundraiserState>({
    status: 'loading',
  });

  useEffect(() => {
    if (isAuthInitializing || !accessToken || !slug) return;
    let ignore = false;

    // A different fundraiser starts from a clean loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading' });

    getHostFundraiserBySlug(slug, accessToken)
      .then(fundraiser => {
        if (ignore) return;
        if (!fundraiser) {
          setState({ status: 'unauthorized' });
          return;
        }
        setState({
          status: 'ready',
          fundraiser,
          canEdit: isFundraiserOwnerOrAdmin(fundraiser, userId),
        });
      })
      .catch(error => {
        if (ignore) return;
        if (error instanceof PlatformAPIError) {
          if (error.status === 404) return setState({ status: 'not-found' });
          if (error.status === 401 || error.status === 403) {
            return setState({ status: 'unauthorized' });
          }
        }
        console.error('[useHostedFundraiser] Failed to load:', error);
        setState({ status: 'error' });
      });

    return () => {
      ignore = true;
    };
  }, [accessToken, slug, isAuthInitializing, userId]);

  return state;
}

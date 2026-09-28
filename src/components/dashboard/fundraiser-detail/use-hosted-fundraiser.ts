'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useEffect, useState } from 'react';
import { getFundraiserAuthenticated } from '@/lib/api/fundraiser-service';
import { getFundraisers } from '@/lib/api/fundraisers-service';
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
 * Membership comes from the platform's list of fundraisers the caller actively hosts. That list also carries every host, private ones included, while the single-fundraiser payload only has the public ones, so its hosts replace the payload's.
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

    Promise.all([
      getFundraiserAuthenticated(slug, accessToken),
      getFundraisers(accessToken),
    ])
      .then(([fundraiser, hosted]) => {
        if (ignore) return;
        const listed = hosted.find(entry => entry.id === fundraiser.id);
        if (!listed) {
          setState({ status: 'unauthorized' });
          return;
        }
        const withAllHosts = { ...fundraiser, hosts: listed.hosts };
        setState({
          status: 'ready',
          fundraiser: withAllHosts,
          canEdit: isFundraiserOwnerOrAdmin(withAllHosts, userId),
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

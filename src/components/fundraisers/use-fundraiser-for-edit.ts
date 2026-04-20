'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useEffect, useState } from 'react';
import { PlatformAPIError } from '@/lib/api/external-client';
import { getFundraiserByIdAuthenticated } from '@/lib/api/fundraiser-service';
import { useAuthStore } from '@/stores/authStore';

export type FundraiserEditStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'not-found'
  | 'unauthorized'
  | 'error';

export interface FundraiserEditState {
  status: FundraiserEditStatus;
  fundraiser: Fundraiser | null;
  errorMessage: string | null;
}

function isUserAuthorized(
  fundraiser: Fundraiser,
  userId: string | undefined
): boolean {
  if (!userId) {
    return false;
  }
  return fundraiser.hosts.some(
    host => host.user?.id === userId && host.role === 'owner'
  );
}

export function useFundraiserForEdit(id: string): FundraiserEditState {
  const accessToken = useAuthStore(state => state.accessToken);
  const userId = useAuthStore(state => state.user?.sub);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);
  const [state, setState] = useState<FundraiserEditState>({
    status: 'idle',
    fundraiser: null,
    errorMessage: null,
  });

  useEffect(() => {
    if (isAuthInitializing || !accessToken || !id) {
      return;
    }

    const abort = { cancelled: false };

    void (async () => {
      setState({ status: 'loading', fundraiser: null, errorMessage: null });

      try {
        const fundraiser = await getFundraiserByIdAuthenticated(
          id,
          accessToken
        );

        if (abort.cancelled) return;

        if (!isUserAuthorized(fundraiser, userId)) {
          setState({
            status: 'unauthorized',
            fundraiser: null,
            errorMessage: null,
          });
          return;
        }

        setState({ status: 'ready', fundraiser, errorMessage: null });
      } catch (error) {
        if (abort.cancelled) return;

        if (error instanceof PlatformAPIError) {
          if (error.status === 404) {
            setState({
              status: 'not-found',
              fundraiser: null,
              errorMessage: null,
            });
            return;
          }
          if (error.status === 401 || error.status === 403) {
            setState({
              status: 'unauthorized',
              fundraiser: null,
              errorMessage: null,
            });
            return;
          }
        }

        const message =
          error instanceof Error ? error.message : 'Failed to load fundraiser';
        setState({
          status: 'error',
          fundraiser: null,
          errorMessage: message,
        });
      }
    })();

    return () => {
      abort.cancelled = true;
    };
  }, [accessToken, id, isAuthInitializing, userId]);

  return state;
}

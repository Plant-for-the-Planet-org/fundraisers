'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useAuthStore } from '@/stores/auth-store';
import { useHostedFundraiserIds } from './use-hosted-fundraiser-ids';

/**
 * True when the logged-in user actively hosts this fundraiser, in any role, view-only co-hosts included. False while auth settles.
 *
 * A host who set themselves private (`isPublic: false`) is removed from the anonymous fundraiser payload, so `fundraiser.hosts` alone cannot show them.
 * For that case it checks the user's own hosted-fundraiser list, fetched once per identity and cached across pages.
 */
export function useIsHost(fundraiser: Fundraiser): boolean {
  const userId = useAuthStore(state => state.user?.sub);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  // Does the page data already list the user as a host? Then no lookup is needed.
  const isVisibleHost =
    !!userId && fundraiser.hosts.some(host => host.user?.id === userId);

  // Logged in but not listed: only now look at the user's own hosted list, to catch a private host.
  const { hostIds } = useHostedFundraiserIds({
    enabled: !isAuthInitializing && !!userId && !isVisibleHost,
  });

  if (isAuthInitializing) return false;
  return isVisibleHost || (hostIds?.has(fundraiser.id) ?? false);
}

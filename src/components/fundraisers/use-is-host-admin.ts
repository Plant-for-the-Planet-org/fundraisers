'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { isFundraiserOwnerOrAdmin } from '@/lib/utils/fundraiser';
import { useAuthStore } from '@/stores/auth-store';
import { useHostedAdminIds } from './use-hosted-admin-ids';

/**
 * True when the logged-in user owns or admins this fundraiser. False while auth settles.
 *
 * A host who set themselves private (`isPublic: false`) is removed from the anonymous fundraiser payload, so `fundraiser.hosts` alone cannot show them.
 * For that case it checks the user's own hosted-fundraiser list, fetched once per identity and cached across pages.
 */
export function useIsHostAdmin(fundraiser: Fundraiser): boolean {
  const userId = useAuthStore(state => state.user?.sub);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  // Does the page data already show the user as an owner/admin host? Then they can edit, no lookup needed.
  const isVisibleHostAdmin = isFundraiserOwnerOrAdmin(fundraiser, userId);

  // Does the page data show the user as a host at all (any role)? If so we can see their role, so they are not a hidden private host. Only a user missing from the page data could be one.
  const isVisibleHost =
    !!userId && fundraiser.hosts.some(host => host.user?.id === userId);

  // Logged in but not shown as a host here. Only now do the extra lookup, to catch a private host (private hosts are removed from the page data). A visible viewer already cannot edit, so we skip them.
  const { adminIds } = useHostedAdminIds({
    enabled: !isAuthInitializing && !!userId && !isVisibleHost,
  });

  if (isAuthInitializing) return false;
  return isVisibleHostAdmin || (adminIds?.has(fundraiser.id) ?? false);
}

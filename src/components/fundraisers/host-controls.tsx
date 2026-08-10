'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PencilLine } from 'lucide-react';
import { isFundraiserOwnerOrAdmin } from '@/lib/utils/fundraiser';
import { useAuthStore } from '@/stores/auth-store';
import { useHostedAdminIds } from '@/components/fundraisers/use-hosted-admin-ids';

/**
 * Shown only to a logged-in host (owner/admin) viewing the public page.
 * Auth lives in the client store, so this renders as a client island inside
 * the server-rendered fundraiser view and renders nothing for everyone else.
 *
 * A host who set themselves private (`isPublic: false`) is stripped from the
 * anonymous fundraiser payload, so `fundraiser.hosts` alone can't reveal them.
 * For that case we fall back to the user's own hosted-fundraiser list (fetched
 * once per identity, cached across pages) to check ownership.
 */
export function HostControls({ fundraiser }: { fundraiser: Fundraiser }) {
  const t = useTranslations('Fundraisers.hostControls');
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

  const isHostAdmin =
    (isVisibleHostAdmin || adminIds?.has(fundraiser.id)) ?? false;

  // Wait for auth to settle, then only show to hosts.
  if (isAuthInitializing || !isHostAdmin) {
    return null;
  }

  const editPath = `/dashboard/fundraisers/edit/${fundraiser.slug || fundraiser.id}`;

  return (
    <div className='flex items-center justify-between gap-2 text-sm text-muted-foreground'>
      <span className='flex items-center gap-2'>
        <PencilLine className='size-4 shrink-0' aria-hidden='true' />
        {t('hostLabel')}
      </span>
      <Link
        href={editPath}
        className='shrink-0 font-medium text-foreground underline-offset-2 hover:underline'
      >
        {t('editButton')}
      </Link>
    </div>
  );
}

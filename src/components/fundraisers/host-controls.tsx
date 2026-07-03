'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PencilLine } from 'lucide-react';
import { isFundraiserOwnerOrAdmin } from '@/lib/utils/fundraiser';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Shown only to a logged-in host (owner/admin) viewing the public page.
 * Auth lives in the client store, so this renders as a client island inside
 * the server-rendered fundraiser view and renders nothing for everyone else.
 */
export function HostControls({ fundraiser }: { fundraiser: Fundraiser }) {
  const t = useTranslations('Fundraisers.hostControls');
  const userId = useAuthStore(state => state.user?.sub);
  const isAuthInitializing = useAuthStore(state => state.isAuthInitializing);

  // Wait for auth to settle, then only show to hosts.
  if (isAuthInitializing || !isFundraiserOwnerOrAdmin(fundraiser, userId)) {
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

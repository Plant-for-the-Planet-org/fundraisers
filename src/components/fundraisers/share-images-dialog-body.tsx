'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShareStudio } from '@/components/share/share-studio';
import { useIsHost } from './use-is-host';

/** What the "Share images" dialog shows: the donor studio without a gift, and for a host a way to the full studio. */
export function ShareImagesDialogBody({
  fundraiser,
  fitHeight,
}: {
  fundraiser: Fundraiser;
  /** The room the dialog leaves for this body, as a CSS length. */
  fitHeight: string;
}) {
  const t = useTranslations('Fundraisers.shareImages');
  const isHost = useIsHost(fundraiser);

  return (
    <div className='grid gap-4'>
      <ShareStudio
        fundraiser={fundraiser}
        variant='donor'
        sharer={isHost ? 'host' : 'supporter'}
        // A host's link below takes one line and the gap above it.
        fitHeight={isHost ? `calc(${fitHeight} - 2.25rem)` : fitHeight}
        pinActions
      />
      {isHost && (
        <Link
          href={`/dashboard/fundraisers/${encodeURIComponent(fundraiser.slug)}/share`}
          className='justify-self-center text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline'
        >
          {t('moreOptions')}
        </Link>
      )}
    </div>
  );
}

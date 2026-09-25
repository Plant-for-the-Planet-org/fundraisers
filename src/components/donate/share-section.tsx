'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { buildShareUrl } from '@/lib/share/links';
import { getReferralCode } from '@/lib/share/referral';
import { useAuthStore } from '@/stores/auth-store';
import { CopyLinkButton } from '@/components/fundraisers/copy-link-button';
import { ShareStudio } from '@/components/share/share-studio';
import { useOrigin } from '@/components/share/use-share-render';
import { Button } from '@/components/ui/button';

interface ShareSectionProps {
  fundraiser: Fundraiser;
}

/** After a donation: copy the link, or open the story and post images to share. A signed-in donor's link carries their code. */
export function ShareSection({ fundraiser }: ShareSectionProps) {
  const t = useTranslations('Donate.thankYou.share');
  const tShare = useTranslations('Share.donor');
  const origin = useOrigin();
  const refCode = getReferralCode(useAuthStore(state => state.user?.profile));
  const [open, setOpen] = useState(false);
  const shareUrl = origin
    ? buildShareUrl({
        origin,
        slug: fundraiser.slug,
        source: 'thankyou',
        medium: 'share',
        ref: refCode,
      })
    : undefined;

  return (
    <div className='rounded-2xl border border-gray-100 bg-white px-6 py-6'>
      <h3 className='text-base font-semibold text-gray-900'>{t('title')}</h3>
      <p className='mt-1 text-sm text-gray-500'>{t('description')}</p>
      <div className='mt-3 flex flex-wrap items-center gap-2'>
        <CopyLinkButton url={shareUrl} />
        {!open && (
          <Button
            variant='outline'
            onClick={() => setOpen(true)}
            className='border-border bg-white hover:bg-gray-50'
          >
            {tShare('moreFormats')}
          </Button>
        )}
      </div>
      {open && (
        <div className='mt-4'>
          <ShareStudio fundraiser={fundraiser} variant='donor' />
        </div>
      )}
    </div>
  );
}

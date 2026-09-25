'use client';

import type { RefObject } from 'react';
import type { ShareGift } from '@/lib/share/share-data';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { CopyLinkButton } from '@/components/fundraisers/copy-link-button';
import { useFundraiserShareUrl } from '@/components/fundraisers/use-fundraiser-share-url';
import { StudioErrorBoundary } from '@/components/share/studio-error-boundary';
import { StudioPlaceholder } from '@/components/share/studio-placeholder';

// The fundraiser page bundles this card through the donate overlay, so the studio and its renderer load only once the card is near.
const ShareStudio = dynamic(
  () => import('@/components/share/share-studio').then(mod => mod.ShareStudio),
  { ssr: false, loading: () => <StudioPlaceholder /> }
);

interface ShareSectionProps {
  fundraiser: Fundraiser;
  /** Only for a completed payment. */
  gift: ShareGift | null;
}

/** True once `ref` comes within about a screen of view. The donate overlay scrolls in its own container, not the page. */
function useNearView(ref: RefObject<HTMLElement | null>): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) setNear(true);
      },
      {
        root: node.closest('[data-scroll-container]'),
        rootMargin: '100% 0px',
      }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, near]);
  return near;
}

/** After a donation: copy the link, or share a story or post image right here. A signed-in donor's link carries their code. */
export function ShareSection({ fundraiser, gift }: ShareSectionProps) {
  const t = useTranslations('Donate.thankYou.share');
  const shareUrl = useFundraiserShareUrl(fundraiser.slug, 'thank_you');
  const studioRef = useRef<HTMLDivElement>(null);
  // The studio loads donors, photos and fonts, animates and makes a video. Waiting until the card is close still leaves time to have the file ready before the tap, which Safari needs.
  const near = useNearView(studioRef);

  return (
    <div className='rounded-2xl border border-gray-100 bg-white px-6 py-6'>
      <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2'>
        <h3 className='min-w-32 flex-1 text-base font-semibold text-gray-900'>
          {t('title')}
        </h3>
        <CopyLinkButton url={shareUrl} size='sm' />
      </div>
      <p className='mt-1 text-sm text-gray-500'>{t('description')}</p>
      <div ref={studioRef} className='mt-4'>
        {near ? (
          // On a failure the card keeps its title and Copy Link.
          <StudioErrorBoundary fallback={null}>
            <ShareStudio fundraiser={fundraiser} variant='donor' gift={gift} />
          </StudioErrorBoundary>
        ) : (
          <StudioPlaceholder />
        )}
      </div>
    </div>
  );
}

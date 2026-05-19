import type { Fundraiser } from '@/lib/types/fundraiser';

import { createPortal } from 'react-dom';
import { Skeleton } from '../ui/skeleton';
import { DonateOverlayLayout } from './donate-overlay-layout';
import { ThemedPortalRoot } from './donate-overlay-theme';

interface DonateOverlaySkeletonProps {
  onClose: () => void;
  fundraiser: Fundraiser;
}

export function DonateOverlaySkeleton({
  onClose,
  fundraiser,
}: DonateOverlaySkeletonProps) {
  return createPortal(
    <ThemedPortalRoot fundraiser={fundraiser}>
      <DonateOverlayLayout
        onClose={onClose}
        leftColumn={
          <>
            <Skeleton className='h-20 rounded-md' />
            <Skeleton className='h-40 rounded-md' />
            <Skeleton className='h-60 rounded-md' />
          </>
        }
        rightColumn={<Skeleton className='h-40 rounded-md' />}
      />
    </ThemedPortalRoot>,
    document.body
  );
}

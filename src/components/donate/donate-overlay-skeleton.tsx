import { createPortal } from 'react-dom';
import { Skeleton } from '../ui/skeleton';
import { DonateOverlayLayout } from './donate-overlay-layout';

export function DonateOverlaySkeleton({ onClose }: { onClose: () => void }) {
  return createPortal(
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
    />,
    document.body
  );
}

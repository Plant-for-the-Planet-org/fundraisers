import { Skeleton } from '../ui/skeleton';
import { DonateOverlayLayout } from './donate-overlay-layout';

export function DonateOverlaySkeleton({ onClose }: { onClose: () => void }) {
  return (
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
  );
}

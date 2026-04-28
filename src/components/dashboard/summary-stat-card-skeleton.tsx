import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SummaryStatCardSkeleton() {
  return (
    <Card
      className='gap-3 border-border/60 px-6 py-5 shadow-xs'
      role='status'
      aria-label='Loading'
    >
      <Skeleton className='h-3 w-24' />
      <Skeleton className='h-10 w-32' />
      <Skeleton className='h-4 w-28' />
    </Card>
  );
}

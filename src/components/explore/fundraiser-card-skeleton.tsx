import { Skeleton } from '@/components/ui/skeleton';

export function FundraiserCardSkeleton() {
  return (
    <div className='flex items-start space-x-4'>
      {/* Image skeleton */}
      <Skeleton className='w-20 h-20 rounded-lg shrink-0' />

      <div className='flex-1 min-w-0 space-y-2'>
        {/* Title skeleton */}
        <Skeleton className='h-5 w-3/4' />
        <Skeleton className='h-5 w-1/2' />

        {/* Amount skeleton */}
        <Skeleton className='h-4 w-32' />

        {/* Host skeleton */}
        <Skeleton className='h-4 w-24' />
      </div>
    </div>
  );
}

export function FundraiserCardSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      {Array.from({ length: count }).map((_, i) => (
        <FundraiserCardSkeleton key={i} />
      ))}
    </div>
  );
}

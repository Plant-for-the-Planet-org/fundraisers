import { Skeleton } from '@/components/ui/skeleton';

export function LeaderboardSkeleton() {
  return (
    <div className='w-full flex flex-col gap-3'>
      <div className='flex gap-2'>
        <Skeleton className='h-9 w-20' />
        <Skeleton className='h-9 w-28' />
      </div>
      <div className='flex items-center gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='flex items-center gap-3 shrink-0'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <div className='flex flex-col gap-1'>
              <Skeleton className='h-3.5 w-24' />
              <Skeleton className='h-3 w-16' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

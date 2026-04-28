import { Skeleton } from '@/components/ui/skeleton';

export function FundraiserListItemSkeleton() {
  return (
    <li
      className='fundraiser-list-item flex items-start gap-4 py-4'
      role='status'
      aria-label='Loading'
    >
      <Skeleton className='h-20 w-20 shrink-0 rounded-lg' />
      <div className='min-w-0 flex-1 space-y-2'>
        <Skeleton className='h-5 w-2/3' />
        <Skeleton className='h-4 w-1/3' />
        <Skeleton className='h-4 w-3/4' />
      </div>
    </li>
  );
}

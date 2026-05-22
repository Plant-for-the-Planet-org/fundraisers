import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { FundraiserCardSkeletonGrid } from './fundraiser-card-skeleton';

export function CategoryPageSkeleton() {
  const t = useTranslations('Explore.categoryPage');

  return (
    <div
      className='category-page-skeleton'
      role='status'
      aria-label={t('loadingAria')}
    >
      {/* Header */}
      <div className='mb-8'>
        <div className='space-y-4'>
          <Skeleton className='w-8 h-8' /> {/* Category icon */}
          <div>
            <Skeleton className='h-8 w-48 mb-2' /> {/* Category name */}
            <Skeleton className='h-5 w-32' /> {/* Category count */}
          </div>
        </div>
      </div>

      {/* Fundraisers section */}
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-7 w-24' /> {/* "Fundraisers" */}
          <Skeleton className='h-9 w-56' /> {/* 3 tabs */}
        </div>
        <FundraiserCardSkeletonGrid count={6} />
      </div>
    </div>
  );
}

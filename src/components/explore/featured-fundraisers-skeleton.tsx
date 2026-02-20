import { Skeleton } from '@/components/ui/skeleton';
import { FundraiserCardSkeletonGrid } from '@/components/explore/fundraiser-card-skeleton';

// Create a skeleton that mirrors the full section layout
export function FeaturedFundraisersSkeleton() {
  return (
    <section className='featured-fundraisers space-y-6'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-7 w-48' /> {/* title */}
        <Skeleton className='h-9 w-40' /> {/* tabs */}
      </div>
      <FundraiserCardSkeletonGrid count={6} />
    </section>
  );
}

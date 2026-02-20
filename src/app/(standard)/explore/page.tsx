import { Suspense } from 'react';
import { PageHeader } from '@/components/explore/page-header';
import {
  FundraiserCategories,
  CategoriesSkeleton,
} from '@/components/explore/fundraiser-categories';
import { FeaturedFundraisersLoader } from '@/components/explore/featured-fundraisers-loader';
import { FeaturedFundraisersSkeleton } from '@/components/explore/featured-fundraisers-skeleton';

export default function ExplorePage() {
  return (
    <>
      <PageHeader />
      <div className='space-y-12'>
        <Suspense fallback={<CategoriesSkeleton />}>
          <FundraiserCategories />
        </Suspense>
        <Suspense fallback={<FeaturedFundraisersSkeleton />}>
          <FeaturedFundraisersLoader />
        </Suspense>

        {/*<TopProjects limit={6} />

        <LocalFundraisers /> */}
      </div>
    </>
  );
}

import { Suspense } from 'react';
import { FeaturedFundraisersLoader } from '@/components/explore/featured-fundraisers-loader';
import { FeaturedFundraisersSkeleton } from '@/components/explore/featured-fundraisers-skeleton';
import {
  CategoriesSkeleton,
  FundraiserCategories,
} from '@/components/explore/fundraiser-categories';
import {
  FundraiserCities,
  FundraiserCitiesSkeleton,
} from '@/components/explore/fundraiser-cities';
import { PageHeader } from '@/components/explore/page-header';

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

        {/*<TopProjects limit={6} />*/}

        <Suspense fallback={<FundraiserCitiesSkeleton />}>
          <FundraiserCities />
        </Suspense>
      </div>
    </>
  );
}

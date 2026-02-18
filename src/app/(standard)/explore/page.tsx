import { Suspense } from 'react';
import { PageHeader } from '@/components/explore/page-header';
import {
  FundraiserCategories,
  CategoriesSkeleton,
} from '@/components/explore/fundraiser-categories';
import { FeaturedFundraisers } from '@/components/explore/featured-fundraisers';

export default function ExplorePage() {
  return (
    <>
      <PageHeader />
      <div className='space-y-12'>
        <Suspense fallback={<CategoriesSkeleton />}>
          <FundraiserCategories />
        </Suspense>

        <FeaturedFundraisers /*limit={6}*/ />

        {/*<TopProjects limit={6} />

        <LocalFundraisers /> */}
      </div>
    </>
  );
}

import type { Metadata } from 'next';

import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
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

const META_IMAGE_URL = '/FUNDRAISER-Meta-Cover.jpg';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tExplore = await getTranslations({ locale, namespace: 'Explore' });
  const title = tExplore('title');
  const description = tExplore('description');

  return {
    title,
    description,
    alternates: {
      canonical: '/explore',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: META_IMAGE_URL,
          width: 600,
          height: 314,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [META_IMAGE_URL],
    },
  };
}

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

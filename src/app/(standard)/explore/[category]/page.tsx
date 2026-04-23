import type { Metadata } from 'next';

import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { isFundraiserSortOption } from '@/lib/api/categories-service';
import { CategoryPageLoader } from '@/components/explore/category-page-loader';
import { CategoryPageSkeleton } from '@/components/explore/category-page-skeleton';

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
}

function humanizeCategorySlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ category }, locale] = await Promise.all([params, getLocale()]);
  const tMetadata = await getTranslations({
    locale,
    namespace: 'Explore.categoryPage.metadata',
  });

  const categoryName = humanizeCategorySlug(category);
  const title = tMetadata('title', { categoryName });
  const description = tMetadata('description', { categoryName });

  return {
    title,
    description,
    alternates: {
      canonical: `/explore/${category}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ExploreCategoryPage({
  params,
  searchParams,
}: Props) {
  const { category: slug } = await params;
  const { sort: rawSort } = await searchParams;
  const currentSort = isFundraiserSortOption(rawSort) ? rawSort : 'popular';

  return (
    <Suspense fallback={<CategoryPageSkeleton />}>
      <CategoryPageLoader slug={slug} currentSort={currentSort} />
    </Suspense>
  );
}

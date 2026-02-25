import type { FundraiserSortOptions } from '@/lib/api/categories-service';

import { Suspense } from 'react';
import { CategoryPageLoader } from '@/components/explore/category-page-loader';
import { CategoryPageSkeleton } from '@/components/explore/category-page-skeleton';

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
}

const VALID_SORT_OPTIONS: FundraiserSortOptions[] = [
  'popular',
  'recent',
  'gross',
];

function isFundraiserSortOption(
  value: unknown
): value is FundraiserSortOptions {
  return (
    typeof value === 'string' &&
    (VALID_SORT_OPTIONS as readonly string[]).includes(value)
  );
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

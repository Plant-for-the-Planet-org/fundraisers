import { Suspense } from 'react';
import { isFundraiserSortOption } from '@/lib/api/categories-service';
import { CategoryPageLoader } from '@/components/explore/category-page-loader';
import { CategoryPageSkeleton } from '@/components/explore/category-page-skeleton';

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
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

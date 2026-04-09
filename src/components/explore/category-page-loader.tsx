import type {
  CategoryFundraisersResponse,
  FundraiserSortOptions,
} from '@/lib/api/categories-service';

import { notFound } from 'next/navigation';
import { categoriesService } from '@/lib/api/categories-service';
import { CategoryFundraisers } from './category-fundraisers';
import { CategoryPageHeader } from './category-page-header';

interface CategoryPageLoaderProps {
  slug: string;
  currentSort: FundraiserSortOptions;
}

export async function CategoryPageLoader({
  slug,
  currentSort,
}: CategoryPageLoaderProps) {
  let result: CategoryFundraisersResponse;
  try {
    result = await categoriesService.getCategoryFundraisersWithRetry(slug, {
      sort_by: currentSort,
    });
  } catch {
    notFound();
  }

  const { category, fundraisers } = result;

  return (
    <>
      <CategoryPageHeader category={category} />
      {/* TODO: Add LocationCategoryMap when interactive map is implemented */}
      {/*  {category.category === 'location' && <LocationCategoryMap />} */}
      <CategoryFundraisers
        fundraisers={fundraisers}
        currentSort={currentSort}
        slug={slug}
      />
    </>
  );
}

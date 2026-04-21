import type { Fundraiser } from '@/lib/types/fundraiser';

import { categoriesService } from '@/lib/api/categories-service';
import { isActiveFundraiser } from '@/lib/utils/fundraiser-status';
import { FeaturedFundraisers } from './featured-fundraisers';

async function fetchFundraisers(
  sort: 'popular' | 'gross'
): Promise<Fundraiser[]> {
  try {
    const response = await categoriesService.getCategoryFundraisersWithRetry(
      'all',
      {
        sort_by: sort,
      }
    );
    return response.fundraisers.filter(f => isActiveFundraiser(f));
  } catch (error) {
    console.error(`Failed to fetch ${sort} fundraisers:`, error);
    return [];
  }
}

export async function FeaturedFundraisersLoader() {
  const [popularFundraisers, grossFundraisers] = await Promise.all([
    fetchFundraisers('popular'),
    fetchFundraisers('gross'),
  ]);

  if (!popularFundraisers.length && !grossFundraisers.length) {
    return null;
  }

  const featuredFundraisers = {
    popularFundraisers,
    grossFundraisers,
  };

  return (
    <FeaturedFundraisers featuredFundraisers={featuredFundraisers} limit={6} />
  );
}

import type { Fundraiser } from '@/lib/types/fundraiser';

import { categoriesService } from '@/lib/api/categories-service';
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
    return response.fundraisers;
    // return response.fundraisers.map(adaptFundraiser);
  } catch (error) {
    console.error(`Failed to fetch ${sort} fundraisers:`, error);
    return [];
  }
}

export async function FeaturedFundraisersLoader() {
  // Logic to initially load the featured fundraisers can be implemented here, such as showing skeleton loaders or placeholders while the data is being fetched.
  const [popularFundraisers, grossFundraisers] = await Promise.all([
    fetchFundraisers('popular'),
    fetchFundraisers('gross'),
  ]);

  const featuredFundraisers = {
    popularFundraisers,
    grossFundraisers,
  };

  return (
    <FeaturedFundraisers featuredFundraisers={featuredFundraisers} limit={6} />
  );
}

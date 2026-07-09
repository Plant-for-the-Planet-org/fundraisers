import type { MetadataRoute } from 'next';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { categoriesService } from '@/lib/api/categories-service';
import { getFundraiserUrl } from '@/lib/utils/fundraiser';
import { getSiteUrl } from '@/lib/utils/site-url';

const TOP_N = 10;

// Regenerate once a day rather than only on deploy, so `changeFrequency:
// 'daily'` below is actually true.
export const revalidate = 86400;

async function fetchTopFundraisers(
  sort: 'popular' | 'gross'
): Promise<Fundraiser[]> {
  try {
    const response = await categoriesService.getCategoryFundraisersWithRetry(
      'all',
      { sort_by: sort }
    );
    return response.fundraisers;
  } catch (error) {
    console.error(`Failed to fetch ${sort} fundraisers for sitemap:`, error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const [popular, topRaised] = await Promise.all([
    fetchTopFundraisers('popular'),
    fetchTopFundraisers('gross'),
  ]);

  const fundraisersById = new Map<string, Fundraiser>();
  for (const fundraiser of [
    ...popular.slice(0, TOP_N),
    ...topRaised.slice(0, TOP_N),
  ]) {
    if (fundraiser.visibility === 'public') {
      fundraisersById.set(fundraiser.id, fundraiser);
    }
  }

  return [...fundraisersById.values()].map(fundraiser => ({
    url: `${siteUrl}${getFundraiserUrl(fundraiser)}`,
    changeFrequency: 'daily',
    priority: 0.6,
  }));
}

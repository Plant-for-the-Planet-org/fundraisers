import type { MetadataRoute } from 'next';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { categoriesService } from '@/lib/api/categories-service';
import { getFundraiserUrl } from '@/lib/utils/fundraiser';
import { getSiteUrl } from '@/lib/utils/site-url';

const TOP_N = 10;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const [popular, topRaised] = await Promise.all([
    categoriesService.getCategoryFundraisersWithRetry('all', {
      sort_by: 'popular',
    }),
    categoriesService.getCategoryFundraisersWithRetry('all', {
      sort_by: 'gross',
    }),
  ]);

  const fundraisersById = new Map<string, Fundraiser>();
  for (const fundraiser of [
    ...popular.fundraisers.slice(0, TOP_N),
    ...topRaised.fundraisers.slice(0, TOP_N),
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

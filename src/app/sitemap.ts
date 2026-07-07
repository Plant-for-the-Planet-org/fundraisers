import type { MetadataRoute } from 'next';

import { categoriesService } from '@/lib/api/categories-service';
import { getSiteUrl } from '@/lib/utils/site-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const [causeCategories, locationCategories] = await Promise.all([
    categoriesService.getCategoriesWithRetry('cause'),
    categoriesService.getCategoriesWithRetry('location'),
  ]);

  const categorySlugs = new Set(
    [...causeCategories, ...locationCategories].map(category => category.slug)
  );

  const categoryEntries: MetadataRoute.Sitemap = [...categorySlugs].map(
    slug => ({
      url: `${siteUrl}/explore/${slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  );

  return [
    {
      url: `${siteUrl}/explore`,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...categoryEntries,
  ];
}

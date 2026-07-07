import type { MetadataRoute } from 'next';
import type { Category } from '@/lib/types/category';

import { categoriesService } from '@/lib/api/categories-service';
import { ENABLE_FUNDRAISER_CITIES } from '@/lib/constants/app-config';
import { getSiteUrl } from '@/lib/utils/site-url';

// Mirrors the visibility rules in fundraiser-categories.tsx and
// fundraiser-cities.tsx: only featured cause categories are shown on
// /explore, and location categories only render at all when the cities
// section is enabled. Categories that never render there are still worth
// listing (a slug is a real, crawlable page) but rank lower.
function isVisibleOnExplore(category: Category): boolean {
  if (category.category === 'cause')
    return category.metadata?.featured === true;
  if (category.category === 'location') {
    return ENABLE_FUNDRAISER_CITIES && category.metadata?.featured === true;
  }
  return false;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const [causeCategories, locationCategories] = await Promise.all([
    categoriesService.getCategoriesWithRetry('cause'),
    categoriesService.getCategoriesWithRetry('location'),
  ]);

  const categoriesBySlug = new Map<string, Category>();
  for (const category of [...causeCategories, ...locationCategories]) {
    categoriesBySlug.set(category.slug, category);
  }

  const categoryEntries: MetadataRoute.Sitemap = [
    ...categoriesBySlug.values(),
  ].map(category => ({
    url: `${siteUrl}/explore/${category.slug}`,
    changeFrequency: 'weekly',
    priority: isVisibleOnExplore(category) ? 0.7 : 0.3,
  }));

  return [
    {
      url: `${siteUrl}/explore`,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...categoryEntries,
  ];
}

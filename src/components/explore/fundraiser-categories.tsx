import type { Category } from '@/lib/types/category';

import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { CategoryIcon } from './category-icon';
import { Skeleton } from '../ui/skeleton';
import { categoriesService } from '@/lib/api/categories-service';
import { getLocalizedAbbreviatedCount } from '@/lib/utils';

interface AdaptedCategory extends Category {
  displayCount: string;
}

export function CategoriesSkeleton() {
  return (
    <section className='space-y-6'>
      <div>
        <Skeleton className='h-7 w-48 mb-2' />
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className='p-4 rounded-lg border border-border bg-card'>
            <div className='flex flex-col items-start space-y-3'>
              <Skeleton className='w-14 h-14' />
              <div className='w-full'>
                <Skeleton className='h-5 w-24 mb-1' />
                <Skeleton className='h-4 w-20' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function FundraiserCategories() {
  const [tCategories, locale] = await Promise.all([
    getTranslations('Explore.categories'),
    getLocale(),
  ]);

  let categories: AdaptedCategory[] = [];

  try {
    const rawCategories =
      await categoriesService.getCategoriesWithRetry('cause');

    categories = rawCategories
      .filter(
        category =>
          category.category === 'cause' && category.metadata?.featured === true
      )
      .slice(0, 8)
      .map(category => {
        const count = category.stats?.fundraiserCount ?? 0;
        const formattedCount = getLocalizedAbbreviatedCount(count, locale);
        return {
          ...category,
          displayCount: tCategories('fundraiserCount', {
            count,
            formattedCount,
          }),
        };
      });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return null;
  }

  if (categories.length === 0) {
    return (
      <section className='fundraiser-categories space-y-6'>
        <div>
          <h2 className='text-xl font-semibold text-foreground mb-2'>
            {tCategories('title')}
          </h2>
        </div>
        <div className='text-center py-8 text-muted-foreground'>
          <p>{tCategories('noCategoriesFound')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className='fundraiser-categories space-y-6'>
      <div>
        <h2 className='text-xl font-semibold text-foreground mb-2'>
          {tCategories('title')}
        </h2>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
        {categories.map(category => (
          <Link
            key={category.id}
            href={`/explore/${category.slug}`}
            className='group block p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-colors'
          >
            <div className='flex flex-col items-start space-y-3'>
              <div className='w-14 h-14 flex items-center justify-start'>
                <CategoryIcon category={category} size='regular' />
              </div>
              <div>
                <h3 className='font-medium text-foreground group-hover:text-accent-foreground mb-1'>
                  {category.name}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {category.displayCount}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

import type { Category } from '@/lib/types/category';

import { Skeleton } from '@/components/ui/skeleton';
import { categoriesService } from '@/lib/api/categories-service';
import { getLocalizedAbbreviatedCount } from '@/lib/utils/formatting';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

interface AdaptedCategory extends Category {
  displayCount: string;
}

export async function FundraiserCitiesSkeleton() {
  const tFundraiserCities = await getTranslations('Explore.fundraiserCities');
  return (
    <section
      className='space-y-6'
      aria-label={tFundraiserCities('loading')}
      aria-busy='true'
    >
      <div>
        <Skeleton className='h-7 w-48 mb-2' />
      </div>
      <ul className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className='flex items-center space-x-3'>
            <Skeleton className='w-10 h-10 rounded-full shrink-0' />
            <div className='flex-1 min-w-0 space-y-1'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-3 w-16' />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function FundraiserCities() {
  const [tFundraiserCities, locale] = await Promise.all([
    getTranslations('Explore.fundraiserCities'),
    getLocale(),
  ]);

  let cities: AdaptedCategory[] = [];

  try {
    const rawCities = await categoriesService.getCategoriesWithRetry('cause'); //TODO: Change to 'location' before release

    cities = rawCities
      .filter(city => city.metadata?.featured === true)
      .slice(0, 8)
      .map(city => {
        const count = city.stats?.fundraiserCount ?? 0;
        const formattedCount = getLocalizedAbbreviatedCount(count, locale);
        return {
          ...city,
          displayCount: tFundraiserCities('fundraiserCount', {
            count,
            formattedCount,
          }),
        };
      });
  } catch (error) {
    console.error('Failed to fetch fundraiser cities:', error);
    return null;
  }

  if (cities.length === 0) {
    return null;
  }

  return (
    <section
      className='fundraiser-cities space-y-6'
      aria-labelledby='fundraiser-cities-heading'
    >
      <div>
        <h2
          id='fundraiser-cities-heading'
          className='text-xl font-semibold text-foreground mb-2'
        >
          {tFundraiserCities('title')}
        </h2>
      </div>

      <ul className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
        {cities.map(city => (
          <li key={city.id}>
            <Link
              href={`/explore/${city.slug}`}
              className='group block hover:bg-accent/50 rounded-lg transition-colors'
            >
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0'>
                  {city.metadata?.image ? (
                    <img
                      src={city.metadata.image}
                      alt=''
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div
                      aria-hidden='true'
                      className='w-full h-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center'
                    >
                      <span className='text-xs font-medium text-muted-foreground'>
                        {city.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-medium text-foreground group-hover:text-accent-foreground mb-1 truncate'>
                    {city.name}
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    {city.displayCount}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

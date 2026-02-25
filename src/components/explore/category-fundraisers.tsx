'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { FundraiserSortOptions } from '@/lib/api/categories-service';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FundraiserCard } from './fundraiser-card';
import { FundraiserCardSkeletonGrid } from './fundraiser-card-skeleton';
import { useTranslations } from 'next-intl';

interface CategoryFundraisersProps {
  fundraisers: Fundraiser[];
  currentSort: FundraiserSortOptions;
  slug: string;
}

export function CategoryFundraisers({
  fundraisers,
  currentSort,
  slug,
}: CategoryFundraisersProps) {
  const tCategoryPage = useTranslations('Explore.categoryPage');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSortChange = (newSort: string) => {
    if (newSort === currentSort) return;
    startTransition(() => {
      router.push(`/explore/${slug}?sort=${newSort}`);
    });
  };

  return (
    <section className='category-fundraisers'>
      <Tabs
        className='category-fundraisers space-y-6'
        value={currentSort}
        onValueChange={handleSortChange}
      >
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold text-foreground'>
            {tCategoryPage('fundraisers.title')}
          </h2>
          <TabsList>
            <TabsTrigger value='popular'>
              {tCategoryPage('fundraisers.tabs.popular')}
            </TabsTrigger>
            <TabsTrigger value='recent'>
              {tCategoryPage('fundraisers.tabs.recent')}
            </TabsTrigger>
            <TabsTrigger value='gross'>
              {tCategoryPage('fundraisers.tabs.gross')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value={currentSort}
          aria-live='polite'
          aria-busy={isPending}
        >
          {isPending ? (
            <FundraiserCardSkeletonGrid count={6} />
          ) : fundraisers.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {fundraisers.map(fundraiser => (
                <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
              ))}
            </div>
          ) : (
            <div className='text-center py-12 text-muted-foreground'>
              <p className='text-lg font-medium mb-2'>
                {tCategoryPage('fundraisers.noFundraisersFound')}
              </p>
              <p className='text-sm'>
                {tCategoryPage('fundraisers.noFundraisersFoundDescription')}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { FundraiserCard } from './fundraiser-card';

interface FeaturedFundraisersProps {
  featuredFundraisers: {
    popularFundraisers: Fundraiser[];
    grossFundraisers: Fundraiser[];
  };
  limit?: number;
}

export function FeaturedFundraisers({
  featuredFundraisers: { popularFundraisers, grossFundraisers },
  limit = 12,
}: FeaturedFundraisersProps) {
  const tFeaturedFundraisers = useTranslations('Explore.featuredFundraisers');
  const [currentSort, setCurrentSort] = useState<'popular' | 'gross'>(
    'popular'
  );

  const displayedFundraisers = (
    currentSort === 'popular' ? popularFundraisers : grossFundraisers
  ).slice(0, limit);

  const handleSortChange = (newSort: string) => {
    setCurrentSort(newSort as 'popular' | 'gross');
  };

  return (
    <section className='featured-fundraisers'>
      <Tabs
        className='space-y-6'
        value={currentSort}
        onValueChange={handleSortChange}
      >
        <div className='flex flex-wrap gap-y-1 items-center justify-between'>
          <h2 className='text-xl font-semibold text-foreground'>
            {tFeaturedFundraisers('title')}
          </h2>
          <TabsList>
            <TabsTrigger value='popular'>
              {tFeaturedFundraisers('tabs.popular')}
            </TabsTrigger>
            <TabsTrigger value='gross'>
              {tFeaturedFundraisers('tabs.gross')}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value={currentSort}>
          {displayedFundraisers.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <p>{tFeaturedFundraisers('noFundraisersFound')}</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {displayedFundraisers.map(fundraiser => (
                <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

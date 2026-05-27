import type { Category } from '@/lib/types/category';

import { useLocale, useTranslations } from 'next-intl';
import { formatCompactNumber } from '@/lib/utils';
import { CategoryIcon } from './category-icon';

interface CategoryPageHeaderProps {
  category: Category;
}

export function CategoryPageHeader({ category }: CategoryPageHeaderProps) {
  const tCategoryPage = useTranslations('Explore.categoryPage');
  const locale = useLocale();

  const count = category.stats?.fundraiserCount ?? 0;
  const formattedCount = formatCompactNumber(count, locale);

  return (
    <section className='category-page-header mb-8'>
      <div className='space-y-4'>
        <CategoryIcon category={category} size='compact' />
        <div>
          <h1 className='text-2xl font-bold text-foreground'>
            {category.name}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {tCategoryPage('fundraiserCount', {
              count,
              formattedCount,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}

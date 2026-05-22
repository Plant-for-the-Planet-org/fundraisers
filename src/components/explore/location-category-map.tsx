// This component is a placeholder for the map view of location categories. It will be displayed on the category page when the category type is 'location'. The actual interactive map implementation will be added in the future.
import { getTranslations } from 'next-intl/server';

export async function LocationCategoryMap() {
  const t = await getTranslations('Explore.locationMap');

  return (
    <div className='mb-8 p-8 border-2 border-dashed border-border rounded-lg bg-muted/50'>
      <div className='text-center text-muted-foreground'>
        <p className='text-lg font-medium mb-2'>{t('title')}</p>
        <p className='text-sm'>{t('comingSoon')}</p>
      </div>
    </div>
  );
}

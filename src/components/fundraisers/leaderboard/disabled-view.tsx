import { useTranslations } from 'next-intl';

export function DisabledView() {
  const t = useTranslations('Leaderboard.form.disabledView');

  return (
    <div className='p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800'>
      <div className='text-center text-muted-foreground'>
        <p className='text-sm font-medium mb-1'>{t('title')}</p>
        <p className='text-xs'>{t('description')}</p>
      </div>
    </div>
  );
}

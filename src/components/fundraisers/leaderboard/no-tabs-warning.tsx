import { useTranslations } from 'next-intl';

export function NoTabsWarning() {
  const t = useTranslations('Leaderboard.form.noTabsWarning');

  return (
    <div className='p-6 border-2 border-dashed border-amber-300 dark:border-amber-600 rounded-lg bg-amber-50 dark:bg-amber-950/30'>
      <div className='text-center text-amber-700 dark:text-amber-400'>
        <p className='text-sm font-medium mb-1'>{t('title')}</p>
        <p className='text-xs'>{t('description')}</p>
      </div>
    </div>
  );
}

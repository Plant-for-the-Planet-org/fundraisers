import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function CategoryNotFound() {
  const t = useTranslations('Explore.categoryPage.notFound');

  return (
    <div className='category-not-found py-16 text-center'>
      <h1 className='text-2xl font-bold text-foreground mb-3'>{t('title')}</h1>
      <p className='text-muted-foreground mb-8'>{t('description')}</p>
      <Link
        href='/explore'
        className='text-sm font-medium text-primary hover:underline'
      >
        {t('exploreLinkText')}
      </Link>
    </div>
  );
}

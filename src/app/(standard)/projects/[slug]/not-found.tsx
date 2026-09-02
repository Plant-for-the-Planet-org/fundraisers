import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export default async function ProjectNotFound() {
  const t = await getTranslations('Project.notFound');

  return (
    <div className='flex items-center justify-center py-24'>
      <div className='max-w-md mx-auto text-center'>
        <h1 className='text-6xl font-bold mb-4'>404</h1>
        <h2 className='text-2xl font-semibold mb-2'>{t('title')}</h2>
        <p className='text-foreground/60 mb-8'>{t('description')}</p>
        <Button asChild>
          <Link href='/explore'>{t('exploreCta')}</Link>
        </Button>
      </div>
    </div>
  );
}

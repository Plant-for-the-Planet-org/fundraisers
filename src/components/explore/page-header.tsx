import { useTranslations } from 'next-intl';

interface PageHeaderProps {
  title?: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const tExplore = useTranslations('Explore');

  return (
    <section className='page-header text-left mb-10'>
      <h1 className='text-3xl font-bold text-foreground'>
        {title || tExplore('title')}
      </h1>
      <p className='mt-1 text-muted-foreground max-w-2xl'>
        {description || tExplore('description')}
      </p>
    </section>
  );
}

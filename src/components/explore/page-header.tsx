import { useTranslations } from 'next-intl';

interface PageHeaderProps {
  title?: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const tExplore = useTranslations('Explore');

  return (
    <section className='page-header text-left mb-12'>
      <h1 className='text-2xl font-bold text-foreground mb-4'>
        {title || tExplore('title')}
      </h1>
      <p className='text-md text-muted-foreground max-w-2xl'>
        {description || tExplore('description')}
      </p>
    </section>
  );
}

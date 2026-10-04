import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { LocalizedLink } from '@/components/ui/localized-link';

export function AboutCta() {
  const t = useTranslations('About.cta');

  return (
    <section className='-mx-4 bg-accent-color px-4 py-12 text-center sm:rounded-3xl lg:-mx-8 lg:px-8 text-[var(--cta-foreground,#fff)] sm:px-10 sm:py-16'>
      <div className='mx-auto max-w-2xl space-y-4'>
        <h2 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
          {t('title')}
        </h2>
        <p className='text-lg leading-relaxed opacity-85'>{t('lead')}</p>
        <div className='flex flex-col justify-center gap-3 pt-3 sm:flex-row'>
          <LocalizedLink
            href='/fundraisers/create'
            className={cn(
              buttonVariants({ size: 'lg' }),
              'bg-background text-foreground hover:bg-background hover:opacity-90'
            )}
          >
            {t('start')}
          </LocalizedLink>
          <LocalizedLink
            href='/explore'
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'border-current/50 bg-transparent text-[var(--cta-foreground,#fff)] hover:bg-white/10 hover:text-[var(--cta-foreground,#fff)]'
            )}
          >
            {t('explore')}
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
}

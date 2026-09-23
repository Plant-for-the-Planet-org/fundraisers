import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { LocalizedLink } from '@/components/ui/localized-link';
import { AboutHeroOrbit } from './about-hero-orbit';

export function AboutHero() {
  const t = useTranslations('About.hero');

  return (
    <section className='pt-6 sm:pt-10 md:flex md:items-center md:gap-8'>
      <div className='space-y-5 md:flex-1'>
        <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>
          {t.rich('title', {
            accent: chunks => (
              <span className='text-accent-color'>{chunks}</span>
            ),
          })}
        </h1>
        <p className='text-lg leading-relaxed text-muted-foreground'>
          {t('lead')}
        </p>
        <div className='flex flex-col gap-3 pt-2 sm:flex-row'>
          <LocalizedLink
            href='/fundraisers/create'
            className={cn(
              buttonVariants({ size: 'lg' }),
              'bg-accent-color font-semibold text-[var(--cta-foreground,#fff)] hover:bg-accent-color hover:opacity-90'
            )}
          >
            {t('start')}
          </LocalizedLink>
          <LocalizedLink
            href='/explore'
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            {t('explore')}
          </LocalizedLink>
        </div>
      </div>
      <div className='mt-10 md:mt-0 md:w-[46%] md:shrink-0'>
        <AboutHeroOrbit />
      </div>
    </section>
  );
}

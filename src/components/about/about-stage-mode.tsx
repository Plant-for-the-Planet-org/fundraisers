import { useLocale, useTranslations } from 'next-intl';
import { TvIcon } from '@/components/ui/duotone-icons';
import { StageDemoView } from '@/modules/stage';
import { ABOUT_IMAGES } from './about-images';

const SLIDE_IMAGES = [
  ABOUT_IMAGES.ghana,
  ABOUT_IMAGES.ambassadors,
  ABOUT_IMAGES.monitoring,
];

const DEMO_DONORS = [
  'Lena M.',
  'Jonas',
  'Fernmoor GmbH',
  'Ana and Tomás',
  'Class 7b',
  'Mia K.',
  'Samuel O.',
  'The van Dijk family',
];

export function AboutStageMode() {
  const t = useTranslations('About.stage');
  const locale = useLocale();

  const slides = (['s1', 's2', 's3'] as const).map((key, index) => ({
    position: index + 1,
    title: t(`demo.slides.${key}.title`),
    description: t(`demo.slides.${key}.description`),
    image: SLIDE_IMAGES[index],
    duration: 8,
  }));

  return (
    <section className='md:grid md:grid-cols-2 md:items-center md:gap-8 lg:gap-12'>
      <div className='space-y-4'>
        <p className='text-xs font-semibold uppercase tracking-wider text-accent-color'>
          {t('eyebrow')}
        </p>
        <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
          {t('title')}
        </h2>
        <p className='leading-relaxed text-muted-foreground'>{t('p1')}</p>
        <p className='flex items-start gap-2 text-sm text-muted-foreground'>
          <TvIcon className='mt-0.5 h-4 w-4 shrink-0' aria-hidden='true' />
          {t('devices')}
        </p>
      </div>
      <div className='mt-8 md:mt-0'>
        <StageDemoView
          title={t('demo.title')}
          description={t('demo.description')}
          locale={locale}
          slides={slides}
          currency='EUR'
          goal={5000}
          startRaised={2640}
          donors={DEMO_DONORS}
          // The demo has no fundraiser of its own, so a scan opens Explore, where people can find a real one to give to.
          qrTargetPath='/explore'
          qrDisplayUrl={t('demo.shortUrl')}
          logoEmoji='🥂'
          className='shadow-lg'
        />
      </div>
    </section>
  );
}

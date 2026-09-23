import { useTranslations } from 'next-intl';
import {
  AboutCustomizeSlides,
  type CustomizeSlideKey,
} from './about-customize-slides';

const KEYS: CustomizeSlideKey[] = [
  'themes',
  'colours',
  'type',
  'backgrounds',
  'motion',
  'story',
];

export function AboutCustomize() {
  const t = useTranslations('About.customize');

  return (
    <section className='space-y-8'>
      <div className='max-w-2xl space-y-3'>
        <p className='text-xs font-semibold uppercase tracking-wider text-accent-color'>
          {t('eyebrow')}
        </p>
        <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
          {t('title')}
        </h2>
        <p className='text-lg leading-relaxed text-muted-foreground'>
          {t('lead')}
        </p>
      </div>
      <AboutCustomizeSlides
        slides={KEYS.map(key => ({
          key,
          title: t(`features.${key}.title`),
          text: t(`features.${key}.text`),
        }))}
        prevLabel={t('prev')}
        nextLabel={t('next')}
      />
    </section>
  );
}

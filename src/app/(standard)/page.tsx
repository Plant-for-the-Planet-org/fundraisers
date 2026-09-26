import type { Metadata } from 'next';

import { getLocale, getTranslations } from 'next-intl/server';
import { AboutCta } from '@/components/about/about-cta';
import { AboutCustomize } from '@/components/about/about-customize';
import { AboutDisclaimer } from '@/components/about/about-disclaimer';
import { AboutHero } from '@/components/about/about-hero';
import { AboutHowItWorks } from '@/components/about/about-how-it-works';
import { AboutMoreThanForests } from '@/components/about/about-more-than-forests';
import { AboutProjects } from '@/components/about/about-projects';
import { AboutStageMode } from '@/components/about/about-stage-mode';
import { AboutWhoFor } from '@/components/about/about-who-for';

const META_IMAGE_URL = '/FUNDRAISER-Meta-Cover.jpg';

const OG_LOCALES: Record<string, string> = { en: 'en_US', de: 'de_DE' };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'About' });
  const title = t('meta.title');
  const description = t('meta.description');

  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: {
      title,
      description,
      type: 'website',
      url: '/',
      siteName: 'Plant-for-the-Planet',
      locale: OG_LOCALES[locale],
      alternateLocale: Object.entries(OG_LOCALES)
        .filter(([key]) => key !== locale)
        .map(([, value]) => value),
      images: [{ url: META_IMAGE_URL, width: 600, height: 314, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [META_IMAGE_URL],
    },
  };
}

export default function HomePage() {
  return (
    <div className='space-y-16 sm:space-y-20'>
      <AboutHero />
      <AboutWhoFor />
      <AboutHowItWorks />
      <AboutProjects />
      <AboutCustomize />
      <AboutStageMode />
      <AboutMoreThanForests />
      <AboutCta />
      <AboutDisclaimer />
    </div>
  );
}

import type { Metadata } from 'next';

import { getLocale, getTranslations } from 'next-intl/server';
import { AboutCta } from '@/components/about/about-cta';
import { AboutCustomize } from '@/components/about/about-customize';
import { AboutHero } from '@/components/about/about-hero';
import { AboutHowItWorks } from '@/components/about/about-how-it-works';
import { AboutMoreThanForests } from '@/components/about/about-more-than-forests';
import { AboutStageMode } from '@/components/about/about-stage-mode';
import { AboutWhoFor } from '@/components/about/about-who-for';

const META_IMAGE_URL = '/FUNDRAISER-Meta-Cover.jpg';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'About' });
  const title = t('meta.title');
  const description = t('meta.description');

  return {
    title,
    description,
    alternates: { canonical: '/about' },
    openGraph: {
      title,
      description,
      type: 'website',
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

export default function AboutPage() {
  return (
    <div className='space-y-16 sm:space-y-20'>
      <AboutHero />
      <AboutWhoFor />
      <AboutHowItWorks />
      <AboutCustomize />
      <AboutStageMode />
      <AboutMoreThanForests />
      <AboutCta />
    </div>
  );
}

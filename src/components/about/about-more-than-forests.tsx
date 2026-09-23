import type { ComponentType } from 'react';

import { useTranslations } from 'next-intl';
import {
  BullhornIcon,
  ChildrenIcon,
  CloudIcon,
} from '@/components/ui/duotone-icons';
import { TreesIcon } from '@/components/ui/plant-icons';

const PILLARS: {
  key: 'youth' | 'forests' | 'tools' | 'voice';
  Icon: ComponentType<{ className?: string }>;
  tile: string;
  icon: string;
}[] = [
  {
    key: 'youth',
    Icon: ChildrenIcon,
    tile: 'bg-soft-gold',
    icon: 'text-amber-700',
  },
  {
    key: 'forests',
    Icon: TreesIcon,
    tile: 'bg-planet-100',
    icon: 'text-planet-600',
  },
  {
    key: 'tools',
    Icon: CloudIcon,
    tile: 'bg-soft-blue',
    icon: 'text-blue-700',
  },
  {
    key: 'voice',
    Icon: BullhornIcon,
    tile: 'bg-planet-50',
    icon: 'text-planet-500',
  },
];

export function AboutMoreThanForests() {
  const t = useTranslations('About.more');

  return (
    <section className='md:grid md:grid-cols-[minmax(0,1fr)_320px] md:items-start md:gap-10 lg:gap-14'>
      <div className='space-y-4'>
        <p className='text-xs font-semibold uppercase tracking-wider text-accent-color'>
          {t('eyebrow')}
        </p>
        <h2 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
          {t.rich('title', {
            accent: chunks => (
              <span className='text-accent-color'>{chunks}</span>
            ),
          })}
        </h2>
        <p className='leading-relaxed text-muted-foreground'>{t('p1')}</p>
        <p className='leading-relaxed text-muted-foreground'>{t('p2')}</p>

        {/* Four compact rows in two columns: icon, label, one line. Plain rows, no boxes, so the block stays short beside the photo. */}
        <ul className='grid list-none grid-cols-1 gap-x-6 gap-y-4 p-0 pt-3 sm:grid-cols-2'>
          {PILLARS.map(({ key, Icon, tile, icon }) => (
            <li key={key} className='flex items-start gap-3'>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tile} ${icon}`}
                aria-hidden='true'
              >
                <Icon className='h-5 w-5' />
              </span>
              <div>
                <h3 className='text-sm font-semibold leading-tight'>
                  {t(`pillars.${key}.title`)}
                </h3>
                <p className='mt-0.5 text-sm leading-snug text-muted-foreground'>
                  {t(`pillars.${key}.text`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* The photo that used to greet people on the sign-in page: a child with soil on her hands in a Plant-for-the-Planet shirt. */}
      <img
        src='/sign-in-hero.jpg'
        alt={t('photoAlt')}
        loading='lazy'
        className='mx-auto mt-8 aspect-[6/7] w-full max-w-xs rounded-t-full rounded-b-3xl object-cover md:sticky md:top-24 md:mt-0 md:w-[320px]'
      />
    </section>
  );
}

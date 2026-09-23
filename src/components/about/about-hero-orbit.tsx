import type { ComponentType } from 'react';

import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/avatar';
import {
  BriefcaseIcon,
  CakeCandlesIcon,
  HeartIcon,
} from '@/components/ui/duotone-icons';
import { FallbackAvatar } from '@/components/ui/fallback-avatar';
import { SeedlingIcon, TreesIcon } from '@/components/ui/plant-icons';

// Six chips on a ring, 60° apart, as percentages of the square so the graphic scales with its box.
const PEOPLE: {
  key: 'lena' | 'fernmoor' | 'class' | 'ana' | 'tomas' | 'jonas';
  left: string;
  top: string;
}[] = [
  {
    key: 'lena',
    left: '85%',
    top: '50%',
  },
  {
    key: 'fernmoor',
    left: '67.5%',
    top: '80.3%',
  },
  {
    key: 'class',
    left: '32.5%',
    top: '80.3%',
  },
  {
    key: 'ana',
    left: '15%',
    top: '50%',
  },
  {
    key: 'tomas',
    left: '32.5%',
    top: '19.7%',
  },
  {
    key: 'jonas',
    left: '67.5%',
    top: '19.7%',
  },
];

const STICKERS: {
  Icon: ComponentType<{ className?: string }>;
  className: string;
}[] = [
  {
    Icon: CakeCandlesIcon,
    className: 'left-[2%] top-[18%] -rotate-10 bg-soft-gold text-amber-700',
  },
  {
    Icon: BriefcaseIcon,
    className: 'right-[1%] top-[14%] rotate-9 bg-soft-blue text-blue-700',
  },
  {
    Icon: SeedlingIcon,
    className: 'right-[9%] bottom-[5%] -rotate-6 bg-planet-100 text-planet-600',
  },
  {
    Icon: TreesIcon,
    className: 'left-[8%] bottom-[8%] rotate-12 bg-planet-50 text-planet-600',
  },
];

export function AboutHeroOrbit() {
  const t = useTranslations('About.hero.orbit');

  return (
    <div
      className='relative mx-auto aspect-square w-full max-w-[420px]'
      role='img'
      aria-label={t('alt')}
    >
      <div className='absolute inset-[12%] rounded-full border-[1.5px] border-dashed border-accent-color/30' />
      <div className='absolute inset-[25%] rounded-full bg-accent-color/10' />

      {STICKERS.map(({ Icon, className }, index) => (
        <div
          key={index}
          className={`absolute flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ${className}`}
          aria-hidden='true'
        >
          <Icon className='h-5 w-5' />
        </div>
      ))}

      <div className='absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-color text-[var(--cta-foreground,#fff)] shadow-lg animate-pulse-soft motion-reduce:animate-none'>
        <HeartIcon
          className='h-9 w-9 animate-heartbeat motion-reduce:animate-none'
          aria-hidden='true'
        />
      </div>

      <div className='absolute inset-0 animate-orbit motion-reduce:animate-none'>
        {PEOPLE.map(({ key, left, top }) => (
          <div
            key={key}
            className='absolute -translate-x-1/2 -translate-y-1/2 animate-orbit-reverse motion-reduce:animate-none'
            style={{ left, top }}
          >
            <div className='flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-background pl-1 pr-3 shadow-sm animate-bob motion-reduce:animate-none'>
              <Avatar className='h-8 w-8'>
                <FallbackAvatar seed={key} />
              </Avatar>
              <span className='flex flex-col leading-tight'>
                <span className='text-xs font-semibold text-foreground'>
                  {t(`people.${key}`)}
                </span>
                <span className='text-[11px] text-muted-foreground'>
                  {t('justGave')}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

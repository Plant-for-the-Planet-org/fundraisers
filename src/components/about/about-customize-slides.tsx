'use client';

import type { ComponentType } from 'react';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FontCaseIcon,
  ImageIcon,
  PaletteIcon,
  PenLineIcon,
  SwatchbookIcon,
  WandMagicSparklesIcon,
} from '@/components/ui/duotone-icons';

export type CustomizeSlideKey =
  | 'themes'
  | 'colours'
  | 'type'
  | 'backgrounds'
  | 'motion'
  | 'story';

export interface CustomizeSlide {
  key: CustomizeSlideKey;
  title: string;
  text: string;
}

const LOOK: Record<
  CustomizeSlideKey,
  {
    Icon: ComponentType<{ className?: string }>;
    tile: string;
    icon: string;
  }
> = {
  themes: {
    Icon: SwatchbookIcon,
    tile: 'bg-planet-50 dark:bg-muted',
    icon: 'bg-planet-100 text-planet-600 dark:bg-background/40',
  },
  colours: {
    Icon: PaletteIcon,
    tile: 'bg-soft-gold dark:bg-muted',
    icon: 'bg-amber-100 text-amber-700 dark:bg-background/40',
  },
  type: {
    Icon: FontCaseIcon,
    tile: 'bg-soft-blue dark:bg-muted',
    icon: 'bg-blue-100 text-blue-700 dark:bg-background/40',
  },
  backgrounds: {
    Icon: ImageIcon,
    tile: 'bg-planet-100 dark:bg-muted',
    icon: 'bg-planet-200 text-planet-700 dark:bg-background/40',
  },
  motion: {
    Icon: WandMagicSparklesIcon,
    tile: 'bg-soft-gold dark:bg-muted',
    icon: 'bg-amber-100 text-amber-700 dark:bg-background/40',
  },
  story: {
    Icon: PenLineIcon,
    tile: 'bg-planet-50 dark:bg-muted',
    icon: 'bg-planet-100 text-planet-600 dark:bg-background/40',
  },
};

interface AboutCustomizeSlidesProps {
  slides: CustomizeSlide[];
  prevLabel: string;
  nextLabel: string;
}

const NAV_BUTTON =
  'rounded-full bg-accent-color/10 text-accent-color hover:bg-accent-color/20 hover:text-accent-color';

// Horizontal scroll-snap track. Buttons nudge it one card at a time; swipe and trackpad work without them.
export function AboutCustomizeSlides({
  slides,
  prevLabel,
  nextLabel,
}: AboutCustomizeSlidesProps) {
  const trackRef = useRef<HTMLUListElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return;
    const gap = 16;
    track.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: 'smooth',
    });
  }

  return (
    <div className='space-y-2'>
      <ul
        ref={trackRef}
        className='-mx-4 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      >
        {slides.map(({ key, title, text }) => {
          const { Icon, tile, icon } = LOOK[key];
          return (
            <li
              key={key}
              className={`flex w-[280px] shrink-0 snap-start flex-col gap-4 rounded-3xl p-6 sm:w-[340px] ${tile}`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${icon}`}
                aria-hidden='true'
              >
                <Icon className='h-6 w-6' />
              </span>
              <div className='space-y-1.5'>
                <h3 className='text-lg font-semibold tracking-tight'>
                  {title}
                </h3>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  {text}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={NAV_BUTTON}
          aria-label={prevLabel}
          onClick={() => scrollByCard(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={NAV_BUTTON}
          aria-label={nextLabel}
          onClick={() => scrollByCard(1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

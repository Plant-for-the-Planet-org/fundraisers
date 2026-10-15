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

// Cards and icon tiles follow the page's accent, so they match whatever theme the page uses.
const ICONS: Record<
  CustomizeSlideKey,
  ComponentType<{ className?: string }>
> = {
  themes: SwatchbookIcon,
  colours: PaletteIcon,
  type: FontCaseIcon,
  backgrounds: ImageIcon,
  motion: WandMagicSparklesIcon,
  story: PenLineIcon,
};

interface AboutCustomizeSlidesProps {
  slides: CustomizeSlide[];
  prevLabel: string;
  nextLabel: string;
}

const NAV_BUTTON =
  'rounded-full bg-accent-color/10 text-accent-ink hover:bg-accent-color/20 hover:text-accent-ink';

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
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    track.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  return (
    <div className='space-y-2'>
      {/* The track runs to the screen edges, so cards slide off the page instead of being cut at the column. --bleed is the gap from the screen edge to the text column: MainContent is 960px wide with 1rem padding. */}
      <ul
        ref={trackRef}
        className='-mx-(--bleed) flex list-none snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth motion-reduce:scroll-auto px-(--bleed) scroll-px-(--bleed) pb-2 [--bleed:max(1rem,calc((100vw-960px)/2+1rem))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      >
        {slides.map(({ key, title, text }) => {
          const Icon = ICONS[key];
          return (
            <li
              key={key}
              className='flex w-[280px] shrink-0 snap-start flex-col gap-4 rounded-3xl bg-mode-base/60 p-6 sm:w-[340px] dark:bg-muted'
            >
              <span
                className='flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-color/10 text-accent-ink dark:bg-background/40'
                aria-hidden='true'
              >
                <Icon className='h-6 w-6' />
              </span>
              <div className='space-y-1.5'>
                <h3 className='text-lg font-semibold tracking-tight'>
                  {title}
                </h3>
                <p className='text-sm leading-relaxed text-gray-600 dark:text-muted-foreground'>
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

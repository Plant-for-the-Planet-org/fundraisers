'use client';

import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LeafyGreenIcon,
  SeedlingIcon,
  TreeDeciduousIcon,
} from '@/components/ui/plant-icons';

// Before, on the day, after: the icons grow with the story.
const MOMENT_ICONS = [SeedlingIcon, LeafyGreenIcon, TreeDeciduousIcon] as const;

const STORY_MS = 7000;

export interface AboutStory {
  scene: string;
  moments: { label: string; text: string }[];
}

interface AboutStorySliderProps {
  stories: AboutStory[];
  /** One node per story, e.g. the matching example card. The active one is highlighted and clicking one jumps to its story. */
  aside?: ReactNode[];
  /** Shown beside the stories when there are no per-story asides. */
  staticAside?: ReactNode;
  footer?: ReactNode;
  /** One accessible label per dot, e.g. "Show story 2 of 3". */
  dotLabels: string[];
  pauseLabel: string;
  playLabel: string;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

// Cycles through a tab's stories every few seconds. Pauses on hover and keyboard focus, has a pause button for touch screens (WCAG 2.2.2), and never auto-advances under reduced motion.
export function AboutStorySlider({
  stories,
  aside,
  staticAside,
  footer,
  dotLabels,
  pauseLabel,
  playLabel,
}: AboutStorySliderProps) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const canAutoplay = !reducedMotion && stories.length > 1;
  const autoplay = canAutoplay && !hovered && !focused && !stopped;

  useEffect(() => {
    if (!autoplay) return;
    const id = setTimeout(
      () => setActive(i => (i + 1) % stories.length),
      STORY_MS
    );
    return () => clearTimeout(id);
  }, [active, autoplay, stories.length]);

  return (
    <div
      className='lg:flex lg:items-stretch lg:gap-10'
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <div className='flex flex-col gap-4 lg:flex-1'>
        {/* All stories share one grid cell, so the card always takes the height of the longest story and never jumps between slides. On large screens it also stretches to the height of the example cards beside it. */}
        <div
          className='grid rounded-2xl bg-background/45 p-4 ring-1 ring-accent-color/10 sm:p-6 lg:flex-1'
          // Announce only changes the user makes, not every automatic slide.
          aria-live={autoplay ? 'off' : 'polite'}
        >
          {stories.map((item, index) => (
            <div
              key={index}
              aria-hidden={index !== active}
              className={cn(
                'space-y-4 [grid-area:1/1] transition-opacity duration-500 motion-reduce:transition-none',
                index === active ? 'opacity-100' : 'invisible opacity-0'
              )}
            >
              <p className='text-base font-medium leading-relaxed text-foreground'>
                {item.scene}
              </p>
              <ol className='list-none space-y-3 p-0'>
                {item.moments.map((moment, momentIndex) => {
                  const Icon = MOMENT_ICONS[momentIndex % MOMENT_ICONS.length];
                  return (
                    <li key={moment.label} className='flex gap-3'>
                      <Icon
                        className='mt-0.5 h-4 w-4 shrink-0 text-accent-color'
                        aria-hidden
                      />
                      <div className='space-y-0.5'>
                        <p className='text-xs font-semibold uppercase tracking-wider text-accent-color'>
                          {moment.label}
                        </p>
                        <p className='text-sm leading-relaxed text-muted-foreground'>
                          {moment.text}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>

        {stories.length > 1 && (
          <div className='flex items-center gap-2'>
            {stories.map((_, index) => (
              <button
                key={index}
                type='button'
                aria-label={dotLabels[index]}
                aria-current={index === active}
                onClick={() => setActive(index)}
                className={cn(
                  'relative h-2 overflow-hidden rounded-full bg-accent-color/25 transition-all duration-300',
                  index === active ? 'w-8' : 'w-2 hover:bg-accent-color/50'
                )}
              >
                {index === active && (
                  <span
                    key={active}
                    className='absolute inset-y-0 left-0 rounded-full bg-accent-color animate-story-progress motion-reduce:w-full motion-reduce:animate-none'
                    style={{
                      animationDuration: `${STORY_MS}ms`,
                      animationPlayState: autoplay ? 'running' : 'paused',
                    }}
                  />
                )}
              </button>
            ))}
            {canAutoplay && (
              <button
                type='button'
                aria-label={stopped ? playLabel : pauseLabel}
                onClick={() => setStopped(value => !value)}
                className='ml-1 flex h-7 w-7 items-center justify-center rounded-full text-accent-color transition-colors hover:bg-accent-color/10'
              >
                {stopped ? (
                  <Play className='h-3.5 w-3.5' aria-hidden='true' />
                ) : (
                  <Pause className='h-3.5 w-3.5' aria-hidden='true' />
                )}
              </button>
            )}
          </div>
        )}

        {footer}
      </div>

      <div className='mt-6 lg:mt-0 lg:w-[400px] lg:shrink-0'>
        {aside ? (
          <div className='space-y-2'>
            {aside.map((node, index) => (
              <button
                key={index}
                type='button'
                onClick={() => setActive(index)}
                aria-pressed={index === active}
                className={cn(
                  'block w-full rounded-xl p-2 text-left transition-colors duration-300',
                  index === active
                    ? 'bg-background/80 shadow-sm ring-1 ring-accent-color/30'
                    : 'hover:bg-background/40'
                )}
              >
                {node}
              </button>
            ))}
          </div>
        ) : (
          staticAside
        )}
      </div>
    </div>
  );
}

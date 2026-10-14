'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/** The sections a link can point to with `?focus=`. Each is marked `data-focus` in the form. */
export const FOCUS_SECTIONS = [
  'image',
  'story',
  'goal',
  'publish',
  'stage',
  'leaderboard',
  'thankyou',
] as const;
export type FocusSection = (typeof FOCUS_SECTIONS)[number];

// A light touch: a faint tint and a thin soft outline, with a little room around the section (the negative margin keeps the layout from moving).
const HIGHLIGHT_BASE = [
  'rounded-xl',
  '-m-3',
  'p-3',
  'transition-[background-color,box-shadow]',
  'duration-700',
];
const HIGHLIGHT_ON = ['bg-accent-color/5', 'ring-1', 'ring-accent-color/30'];
const HIGHLIGHT_MS = 2500;
// The tint fades out before the spacing is taken away, so nothing jumps.
const FADE_MS = 700;
// The form fills in as the fundraiser loads, so the section may not exist yet.
const WAIT_MS = 100;
const MAX_TRIES = 100;

const FOCUSABLE =
  '[contenteditable="true"], input:not([type="hidden"]), textarea, button[role="switch"], select';

/**
 * Takes a visitor who came from a checklist step straight to the part of the form they need: scrolls it to the middle, puts the cursor in it and rings it for a moment.
 * Reads `?focus=` once when the form opens and then drops it from the address, so a refresh does not repeat it.
 */
export function FocusSectionFromLink() {
  // Read once. Dropping `?focus=` from the address changes the search params, and that must not cancel the search that is under way.
  const params = useSearchParams();
  const [target] = useState(() => params.get('focus'));

  useEffect(() => {
    if (!FOCUS_SECTIONS.includes(target as FocusSection)) return;
    let tries = 0;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;

    const find = () => {
      const section = document.querySelector<HTMLElement>(
        `[data-focus="${target}"]`
      );
      if (!section) {
        if (++tries < MAX_TRIES) return false;
        return true;
      }
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      section
        .querySelector<HTMLElement>(FOCUSABLE)
        ?.focus({ preventScroll: true });
      section.classList.add(...HIGHLIGHT_BASE, ...HIGHLIGHT_ON);
      // One gentle pulse outward, so the eye lands on the section. Skipped for people who ask for less motion.
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        section.animate(
          [
            {
              boxShadow:
                '0 0 0 0 color-mix(in srgb, var(--accent-color) 22%, transparent)',
            },
            { boxShadow: '0 0 0 10px transparent' },
          ],
          { duration: 1200, easing: 'ease-out' }
        );
      }
      clearTimer = setTimeout(() => {
        section.classList.remove(...HIGHLIGHT_ON);
        fadeTimer = setTimeout(
          () => section.classList.remove(...HIGHLIGHT_BASE),
          FADE_MS
        );
      }, HIGHLIGHT_MS);
      window.history.replaceState(null, '', window.location.pathname);
      return true;
    };

    const interval = setInterval(() => {
      if (find()) clearInterval(interval);
    }, WAIT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(clearTimer);
      clearTimeout(fadeTimer);
    };
  }, [target]);

  return null;
}

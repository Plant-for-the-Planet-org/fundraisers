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

const HIGHLIGHT_CLASSES = [
  'rounded-xl',
  'ring-2',
  'ring-accent-color',
  'ring-offset-8',
  'ring-offset-transparent',
  'transition-shadow',
];
const HIGHLIGHT_MS = 3000;
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
      section.classList.add(...HIGHLIGHT_CLASSES);
      // A soft pulse out from the ring, twice, so the eye lands on the section. Skipped for people who ask for less motion.
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        section.animate(
          [
            {
              boxShadow:
                '0 0 0 0 color-mix(in srgb, var(--accent-color) 45%, transparent)',
            },
            { boxShadow: '0 0 0 14px transparent' },
          ],
          { duration: 1100, iterations: 2, easing: 'ease-out' }
        );
      }
      clearTimer = setTimeout(
        () => section.classList.remove(...HIGHLIGHT_CLASSES),
        HIGHLIGHT_MS
      );
      window.history.replaceState(null, '', window.location.pathname);
      return true;
    };

    const interval = setInterval(() => {
      if (find()) clearInterval(interval);
    }, WAIT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(clearTimer);
    };
  }, [target]);

  return null;
}

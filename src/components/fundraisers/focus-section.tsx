'use client';

import type { FieldErrors } from 'react-hook-form';

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
const HIGHLIGHT_ON = [
  'bg-accent-color/[0.07]',
  'ring-2',
  'ring-accent-color/40',
];
// Long enough to find it and start working, without staying on for good.
const HIGHLIGHT_MS = 6000;
// Where the section is checked again, in ms, while the page settles.
const SETTLE_MS = [500, 1200, 2200];
const STICKY_BAR_PX = 80;
const TOP_GAP_PX = 96;
// The tint fades out before the spacing is taken away, so nothing jumps.
const FADE_MS = 700;
// The form fills in as the fundraiser loads, so the section may not exist yet.
const WAIT_MS = 100;
const MAX_TRIES = 100;

const FOCUSABLE =
  '[contenteditable="true"], input:not([type="hidden"]), textarea, button[role="switch"], select';

/** The nearest ancestor that scrolls on its own, or the window. */
function getScroller(el: HTMLElement): HTMLElement | Window {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight
    )
      return node;
  }
  return window;
}

/**
 * Scrolls a section to the middle, puts the cursor in it and marks it for a moment.
 * Returns a function that stops the marking early.
 */
export function highlightSection(section: HTMLElement): () => void {
  const scroller = getScroller(section);
  const place = () => {
    // The visible box of whatever scrolls, less the sticky save bar that covers its bottom.
    const box =
      scroller === window
        ? { top: 0, height: window.innerHeight }
        : (scroller as HTMLElement).getBoundingClientRect();
    const usable = box.height - STICKY_BAR_PX;
    const rect = section.getBoundingClientRect();
    // A section taller than the visible box starts below the top edge instead of being centred.
    const offset =
      rect.height > usable * 0.8
        ? rect.top - box.top - TOP_GAP_PX
        : rect.top - box.top - (usable - rect.height) / 2;
    if (Math.abs(offset) > 24)
      scroller.scrollBy({ top: offset, behavior: 'smooth' });
  };
  place();
  // The form is still loading images and editors, which moves things after the first scroll. So the section is put back in the middle a few times, until the visitor takes over by scrolling or typing.
  let moved = false;
  const takeOver = () => {
    moved = true;
  };
  const takeOverEvents = [
    'wheel',
    'touchstart',
    'keydown',
    'mousedown',
  ] as const;
  takeOverEvents.forEach(type =>
    window.addEventListener(type, takeOver, { passive: true, once: true })
  );
  const settleTimers = SETTLE_MS.map(ms =>
    setTimeout(() => {
      if (!moved) place();
    }, ms)
  );
  section.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
  section.classList.add(...HIGHLIGHT_BASE, ...HIGHLIGHT_ON);
  // One gentle pulse outward, so the eye lands on the section. Skipped for people who ask for less motion.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    section.animate(
      [
        {
          boxShadow:
            '0 0 0 0 color-mix(in srgb, var(--accent-color) 30%, transparent)',
        },
        { boxShadow: '0 0 0 10px transparent' },
      ],
      { duration: 1200, easing: 'ease-out' }
    );
  }
  let fadeTimer: ReturnType<typeof setTimeout> | undefined;
  const clearTimer = setTimeout(() => {
    section.classList.remove(...HIGHLIGHT_ON);
    fadeTimer = setTimeout(
      () => section.classList.remove(...HIGHLIGHT_BASE),
      FADE_MS
    );
  }, HIGHLIGHT_MS);
  return () => {
    settleTimers.forEach(clearTimeout);
    takeOverEvents.forEach(type => window.removeEventListener(type, takeOver));
    clearTimeout(clearTimer);
    clearTimeout(fadeTimer);
    section.classList.remove(...HIGHLIGHT_ON, ...HIGHLIGHT_BASE);
  };
}

/** The form field that failed, and the section that holds it. */
const SECTION_FOR_FIELD: Record<string, string> = {
  title: 'title',
  slug: 'slug',
  description: 'story',
  image: 'image',
  country: 'country',
  goalAmount: 'goal',
  projectAllocations: 'projects',
};

/**
 * After a failed submit: takes the visitor to the first section that needs attention, in the order they appear on the page, and marks it like a link does.
 * The field's own red message stays; this only shows where to look.
 */
export function focusFirstError(errors: FieldErrors): void {
  const sections = Object.keys(errors)
    .map(field => SECTION_FOR_FIELD[field])
    .filter((id): id is string => Boolean(id))
    .map(id => document.querySelector<HTMLElement>(`[data-focus="${id}"]`))
    .filter((el): el is HTMLElement => el !== null)
    .sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    );
  if (sections[0]) highlightSection(sections[0]);
}

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
    let stopHighlight: (() => void) | undefined;

    const find = () => {
      const section = document.querySelector<HTMLElement>(
        `[data-focus="${target}"]`
      );
      if (!section) {
        if (++tries < MAX_TRIES) return false;
        return true;
      }
      stopHighlight = highlightSection(section);
      window.history.replaceState(null, '', window.location.pathname);
      return true;
    };

    const interval = setInterval(() => {
      if (find()) clearInterval(interval);
    }, WAIT_MS);

    return () => {
      clearInterval(interval);
      stopHighlight?.();
    };
  }, [target]);

  return null;
}

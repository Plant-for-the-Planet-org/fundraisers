'use client';

import type { KeyboardEvent } from 'react';

const RADIO_SELECTOR = '[role="radio"]:not([aria-disabled="true"])';

/**
 * Arrow, Home and End keys for a radiogroup built from buttons.
 * Moves focus and selection across the enabled radios in DOM order, wrapping at the ends. Rows opt in with `role="radio"`; the checked one is the only Tab stop, see the `tabIndex` on each row.
 */
export function useRadioGroupKeyboard() {
  return (event: KeyboardEvent<HTMLElement>) => {
    const step =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? -1
          : 0;
    const isJump = event.key === 'Home' || event.key === 'End';
    if (!step && !isJump) return;

    const radios = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(RADIO_SELECTOR)
    );
    const current = radios.indexOf(document.activeElement as HTMLElement);
    if (radios.length === 0 || current === -1) return;

    event.preventDefault();

    const next = isJump
      ? event.key === 'Home'
        ? 0
        : radios.length - 1
      : (current + step + radios.length) % radios.length;

    radios[next].focus();
    radios[next].click();
  };
}

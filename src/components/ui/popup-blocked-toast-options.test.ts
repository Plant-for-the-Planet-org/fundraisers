import { describe, expect, it, vi } from 'vitest';
import {
  getPopupBlockedToastLinkTargets,
  POPUP_BLOCKED_TOAST_OPTIONS,
  stopPopupBlockedToastPointerDown,
} from './popup-blocked-toast-options';

describe('POPUP_BLOCKED_TOAST_OPTIONS', () => {
  it('pins the interactive toast to a constrained bottom-right wrapper', () => {
    expect(POPUP_BLOCKED_TOAST_OPTIONS).toMatchObject({
      position: 'bottom-right',
      dismissible: false,
      style: {
        width: 'min(356px, calc(100vw - 32px))',
        maxWidth: 'calc(100vw - 32px)',
        pointerEvents: 'auto',
        zIndex: 2147483647,
      },
    });
  });
});

describe('getPopupBlockedToastLinkTargets', () => {
  it('keeps the clean destination for display/copy but gates navigation', () => {
    const displayHref = 'https://example.com/campaign?source=share';
    const openHref = `/external?url=${encodeURIComponent(displayHref)}`;

    expect(getPopupBlockedToastLinkTargets(displayHref, openHref)).toEqual({
      displayHref,
      openHref,
    });
  });
});

describe('stopPopupBlockedToastPointerDown', () => {
  it('keeps the toast interaction from reaching a modal outside-click listener', () => {
    const stopPropagation = vi.fn();
    const stopImmediatePropagation = vi.fn();

    stopPopupBlockedToastPointerDown({
      stopPropagation,
      nativeEvent: { stopImmediatePropagation },
    });

    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(stopImmediatePropagation).toHaveBeenCalledOnce();
  });
});

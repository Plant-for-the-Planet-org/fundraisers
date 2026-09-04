import type { ExternalToast } from 'sonner';

interface PropagatingPointerEvent {
  stopPropagation: () => void;
  nativeEvent: {
    stopImmediatePropagation: () => void;
  };
}

/** Keeps Radix modals from treating interaction with this toast as outside. */
export function stopPopupBlockedToastPointerDown(
  event: PropagatingPointerEvent
) {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
}

export function getPopupBlockedToastLinkTargets(
  displayHref: string,
  openHref: string
) {
  return { displayHref, openHref };
}

/**
 * `toast.custom()` does not receive Sonner's standard fixed width. Without an
 * explicit wrapper width, a long URL gives the absolutely positioned toast a
 * max-content width and can pull it outside the viewport.
 *
 * This toast contains interactive controls, so disable swipe handling to keep
 * Sonner from capturing their pointer gestures.
 */
export const POPUP_BLOCKED_TOAST_OPTIONS = {
  position: 'bottom-right',
  dismissible: false,
  style: {
    width: 'min(356px, calc(100vw - 32px))',
    maxWidth: 'calc(100vw - 32px)',
    pointerEvents: 'auto',
    zIndex: 2147483647,
  },
} satisfies ExternalToast;

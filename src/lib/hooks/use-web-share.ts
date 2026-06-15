'use client';

import type { ShareData } from '@/lib/share/build-share-data';

import { useCallback } from 'react';

export type ShareResult = 'shared' | 'unsupported' | 'dismissed' | 'error';

/**
 * Native OS share is great on phones/tablets but poor/inconsistent on desktop
 * browsers, so we restrict it to mobile + tablet and let callers fall back to
 * the in-app dialog everywhere else (Windows, macOS, Linux).
 */
function isMobileOrTablet(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  // iPadOS 13+ reports a desktop "Macintosh" UA, so detect it via touch points.
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  return isAndroid || isIOS;
}

/** True only when native share is both available and on a mobile/tablet device. */
function canUseNativeShare(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    isMobileOrTablet()
  );
}

/**
 * Thin wrapper over the native Web Share API.
 *
 * `share()` checks support at call time (no SSR/hydration branching) and
 * classifies the outcome so callers can fall back to an in-app menu when native
 * share is unavailable:
 *
 *  - `shared`      — the OS share sheet completed.
 *  - `dismissed`   — the user closed the sheet (AbortError); no toast needed.
 *  - `unsupported` — native share is off (every desktop, or no `navigator.share`).
 *  - `error`       — anything else went wrong.
 */
export function useWebShare(): {
  isSupported: boolean;
  share: (data: ShareData) => Promise<ShareResult>;
} {
  const isSupported = canUseNativeShare();

  const share = useCallback(async (data: ShareData): Promise<ShareResult> => {
    if (!canUseNativeShare()) {
      return 'unsupported';
    }

    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'dismissed';
      }
      return 'error';
    }
  }, []);

  return { isSupported, share };
}

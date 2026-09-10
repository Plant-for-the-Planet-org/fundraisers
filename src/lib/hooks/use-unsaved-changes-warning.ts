'use client';

import { useEffect } from 'react';

/**
 * Ask the browser to confirm before leaving the page while changes are unsaved.
 *
 * Only covers hard exits — tab close, reload, typing a new URL. `beforeunload`
 * does not fire on App Router soft navigation, so in-app links and the back
 * button after a client-side nav still leave without a prompt.
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean): void {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
}

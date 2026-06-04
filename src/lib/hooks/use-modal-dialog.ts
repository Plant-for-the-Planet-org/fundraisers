'use client';

import type { RefObject } from 'react';

import { useEffect } from 'react';

interface UseModalDialogOptions {
  isOpen: boolean;
  onClose: () => void;
  dialogRef: RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalDialog({
  isOpen,
  onClose,
  dialogRef,
}: UseModalDialogOptions) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, dialogRef]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter(el => el.tabIndex !== -1);
        if (focusable.length === 0) return;

        event.preventDefault();

        const currentIndex = focusable.indexOf(
          document.activeElement as HTMLElement
        );

        if (event.shiftKey) {
          focusable[
            currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1
          ]!.focus();
        } else {
          focusable[
            currentIndex === -1 || currentIndex >= focusable.length - 1
              ? 0
              : currentIndex + 1
          ]!.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, dialogRef]);
}

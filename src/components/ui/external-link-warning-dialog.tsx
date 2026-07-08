'use client';

// DEAD CODE — superseded by the `/external` page route
// (`src/app/(standard)/external/page.tsx`). The in-page modal warning was
// replaced so the fundraiser page itself is never interrupted: trusted
// domains now open instantly, everything else opens `/external` in a new
// tab instead of this dialog. Kept unused (not deleted) so it can be
// restored quickly if the redesign doesn't hold up in review. No longer
// imported anywhere — safe to delete once the review is done.
//
// Adjusted minimally (not functionally) after `tel:` support and the
// `autoFire` field were removed from the shared `link-intent.ts` types, so
// this file keeps compiling: the `tel` case is gone and "auto-fires" is
// inlined as `scheme === 'web'` instead of reading the removed field.

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getLinkIntent, openInNewTab } from '@/lib/utils/link-intent';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { showPopupBlockedToast } from '@/components/ui/popup-blocked-toast';

const COUNTDOWN_SECONDS = 10;

interface ExternalLinkWarningDialogProps {
  /** The pending link, or null when no warning is showing. */
  href: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ExternalLinkWarningDialog({
  href,
  onOpenChange,
}: ExternalLinkWarningDialogProps) {
  const t = useTranslations('Common.externalLinkWarning');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  const intent = href ? getLinkIntent(href) : null;

  // Only web links auto-redirect on a countdown — mailto requires an
  // explicit click so an app hand-off never happens silently.
  useEffect(() => {
    if (!href || intent?.scheme !== 'web') return undefined;

    setSecondsLeft(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft(previous => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [href]);

  const go = () => {
    if (!href || !intent) return;

    if (intent.scheme === 'web') {
      if (!openInNewTab(href)) {
        showPopupBlockedToast(href);
      }
    } else {
      window.location.href = href;
    }
    onOpenChange(false);
  };

  useEffect(() => {
    if (intent?.scheme === 'web' && secondsLeft === 0) {
      go();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (!href || !intent) return null;

  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  let title: string;
  let body: React.ReactNode;
  let actionLabel: string;

  switch (intent.scheme) {
    case 'mail':
      title = t('mailTitle');
      body = t.rich('mailBody', { address: intent.destination, strong });
      actionLabel = t('goToMail');
      break;
    default:
      title = t('webTitle');
      body = t.rich('webBody', {
        domain: intent.destination,
        seconds: String(secondsLeft),
        strong,
      });
      actionLabel = t('goToLink');
  }

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('stayHere')}</AlertDialogCancel>
          <AlertDialogAction onClick={go}>{actionLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

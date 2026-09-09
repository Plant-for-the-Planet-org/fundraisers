'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  getPopupBlockedToastLinkTargets,
  POPUP_BLOCKED_TOAST_OPTIONS,
  stopPopupBlockedToastPointerDown,
} from '@/components/ui/popup-blocked-toast-options';

interface PopupBlockedToastContentProps {
  displayHref: string;
  openHref: string;
  toastId: string | number;
}

function PopupBlockedToastContent({
  displayHref,
  openHref,
  toastId,
}: PopupBlockedToastContentProps) {
  const t = useTranslations('Common.popupBlocked');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayHref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed silently — the link text itself is still visible and clickable.
    }
  };

  return (
    <div
      onPointerDown={stopPopupBlockedToastPointerDown}
      className='pointer-events-auto flex w-full max-w-full flex-col gap-2 overflow-hidden rounded-lg border border-border bg-background p-4 shadow-lg'
    >
      <p className='text-sm font-medium text-foreground'>{t('title')}</p>
      <p className='text-sm text-muted-foreground'>{t('description')}</p>
      <div className='flex min-w-0 items-center justify-between gap-2'>
        <a
          href={openHref}
          target='_blank'
          rel='noopener noreferrer nofollow'
          onClick={() => toast.dismiss(toastId)}
          title={displayHref}
          className='block min-w-0 flex-1 truncate text-sm font-medium text-primary underline underline-offset-2'
        >
          {displayHref}
        </a>
        <button
          type='button'
          onClick={handleCopy}
          aria-label={t('copy')}
          className={cn(
            'shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          )}
        >
          {copied ? (
            <>
              <Check className='size-4 text-green-500' aria-hidden='true' />
              <span className='sr-only' role='status' aria-live='polite'>
                {t('copied')}
              </span>
            </>
          ) : (
            <Copy className='size-4' aria-hidden='true' />
          )}
        </button>
      </div>
    </div>
  );
}

export function showPopupBlockedToast(displayHref: string, openHref: string) {
  const linkTargets = getPopupBlockedToastLinkTargets(displayHref, openHref);

  toast.custom(
    toastId => <PopupBlockedToastContent {...linkTargets} toastId={toastId} />,
    POPUP_BLOCKED_TOAST_OPTIONS
  );
}

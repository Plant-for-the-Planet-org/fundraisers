'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface PopupBlockedToastContentProps {
  href: string;
  toastId: string | number;
}

function PopupBlockedToastContent({
  href,
  toastId,
}: PopupBlockedToastContentProps) {
  const t = useTranslations('Common.popupBlocked');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed silently — the link text itself is still visible and clickable.
    }
  };

  return (
    <div className='flex w-full flex-col gap-2 rounded-lg border border-border bg-background p-4 shadow-lg'>
      <p className='text-sm font-medium text-foreground'>{t('title')}</p>
      <p className='text-sm text-muted-foreground'>{t('description')}</p>
      <div className='flex items-center justify-between gap-2'>
        <a
          href={href}
          target='_blank'
          rel='noopener noreferrer nofollow'
          onClick={() => toast.dismiss(toastId)}
          className='min-w-0 flex-1 truncate text-sm font-medium text-primary underline underline-offset-2'
        >
          {href}
        </a>
        <button
          type='button'
          onClick={handleCopy}
          aria-label={t('copy')}
          className={cn(
            'shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
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

export function showPopupBlockedToast(href: string) {
  toast.custom(toastId => (
    <PopupBlockedToastContent href={href} toastId={toastId} />
  ));
}

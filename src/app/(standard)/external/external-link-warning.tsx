'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { getLinkIntent, isValidExternalHref } from '@/lib/utils/link-intent';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Warning page for links that aren't a trusted Plant-for-the-Planet domain
 * (plus `mailto:`, which has no domain to trust). Opened in a new tab from
 * the fundraiser page — nothing here ever continues on its own, the donor
 * always clicks "Continue" — so the fundraiser tab itself is never touched
 * and never redirected without the donor's say-so. See `RichTextClickCapture`
 * for the trusted-domain fast path that skips this page entirely.
 *
 * The invalid-link state below is a defensive backstop only: the editor
 * itself refuses to save an unsupported link (see `applyLink` in
 * `rich-text-editor.tsx`), so this normally only triggers for a malformed or
 * hand-crafted `/external` URL, not anything a host can author.
 */
const MAX_DESTINATION_DISPLAY_LENGTH = 64;

function truncateForDisplay(value: string): string {
  return value.length > MAX_DESTINATION_DISPLAY_LENGTH
    ? `${value.slice(0, MAX_DESTINATION_DISPLAY_LENGTH)}...`
    : value;
}

export function ExternalLinkWarning() {
  const t = useTranslations('Common.externalLinkWarning');
  const searchParams = useSearchParams();
  const href = searchParams.get('url');

  const isValid = !!href && isValidExternalHref(href);
  const intent = isValid ? getLinkIntent(href) : null;
  // Only for web links — the mail case already spells out the address inline
  // in mailPromptBody, so a second copy of it here would be redundant.
  const destinationUrl =
    intent?.scheme === 'web' && href ? truncateForDisplay(href) : null;

  const goToDestination = () => {
    if (!href) return;
    // Same tab — this page's own tab becomes the destination. Never opens
    // another tab (that would be a third tab on top of the fundraiser's).
    window.location.href = href;
  };

  const goBack = () => {
    // This tab only ever exists because it was opened programmatically
    // (window.open from the fundraiser page), so closing it is reliable and
    // returns focus to whichever tab opened it.
    window.close();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  let title: string;
  let body: React.ReactNode;
  let showContinue = false;

  if (!intent) {
    title = t('invalidTitle');
    body = t('invalidBody');
  } else if (intent.scheme === 'mail') {
    title = t('mailPromptTitle');
    body = t.rich('mailPromptBody', { address: intent.destination, strong });
    showContinue = true;
  } else {
    title = t('leavingTitle');
    body = t('leavingBody');
    showContinue = true;
  }

  return (
    <div className='flex items-center justify-center'>
      <Card className='w-full border-0 shadow-none max-w-lg bg-transparent text-center gap-y-2'>
        <CardHeader>
          <CardTitle className='text-xl lg:text-2xl'>{title}</CardTitle>
        </CardHeader>
        <CardContent className='mb-4'>
          <CardDescription
            className={twMerge(
              'text-sm text-card-foreground lg:text-base',
              'lg:text-card-foreground'
            )}
          >
            {body}
          </CardDescription>
          {destinationUrl && (
            <p className='mt-3 break-all px-3 py-2 text-sm'>{destinationUrl}</p>
          )}
        </CardContent>
        <CardFooter className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-center'>
          <Button
            variant='outline'
            onClick={goBack}
            className='w-full sm:w-auto'
          >
            {t('goBack')}
          </Button>
          {showContinue && (
            <Button onClick={goToDestination} className='w-full sm:w-auto'>
              {t('continue')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

'use client';

import type { CSSProperties, ReactElement } from 'react';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Images } from 'lucide-react';
import { buildTheme } from '@/lib/theme/build-theme';
import { getFontStack } from '@/lib/theme/font-utils';
import { CopyLinkButton } from '@/components/fundraisers/copy-link-button';
import { useFundraiserShareUrl } from '@/components/fundraisers/use-fundraiser-share-url';
import { StudioErrorBoundary } from '@/components/share/studio-error-boundary';
import { StudioPlaceholder } from '@/components/share/studio-placeholder';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/** The studio's room in the dialog when it puts its choices beside the preview: the dialog's 2rem margin above and below, its header and its bottom padding. */
const STUDIO_FIT_HEIGHT = 'calc(100dvh - 12rem)';

function LoadingStudio() {
  const t = useTranslations('Fundraisers.shareImages');
  return (
    <div role='status'>
      <span className='sr-only'>{t('loading')}</span>
      <StudioPlaceholder fitHeight={STUDIO_FIT_HEIGHT} />
    </div>
  );
}

// The studio and its renderer are large, so they load on the first open instead of with the page.
const ShareImagesDialogBody = dynamic(
  () =>
    import('./share-images-dialog-body').then(mod => mod.ShareImagesDialogBody),
  { ssr: false, loading: LoadingStudio }
);

interface ShareImagesButtonProps {
  fundraiser: Fundraiser;
  /** One element that opens the dialog instead of the "Share images" button. */
  trigger?: ReactElement;
}

/** Opens the donor share studio from the fundraiser page, for anyone who wants to share it. */
export function ShareImagesButton({
  fundraiser,
  trigger,
}: ShareImagesButtonProps) {
  const t = useTranslations('Fundraisers.shareImages');
  const tShare = useTranslations('Donate.thankYou.share');
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const shareUrl = useFundraiserShareUrl(fundraiser.slug);

  // The dialog is portalled to <body>, outside ThemeShell's wrapper. ThemeShell copies the accent onto <html> for portals, but not the fonts.
  const fontStyle = useMemo(() => {
    const theme = buildTheme(fundraiser.settings?.theme);
    return {
      fontFamily: getFontStack(theme.bodyFont),
      '--theme-title-font': getFontStack(theme.titleFont),
    } as CSSProperties;
  }, [fundraiser.settings?.theme]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant='outline'
            className='w-max border-border bg-white hover:bg-gray-50'
          >
            <Images aria-hidden='true' />
            {t('label')}
          </Button>
        )}
      </DialogTrigger>
      {/* Light like the thank-you card, whatever the page's mode. Up to 768px wide, so from about a 752px viewport the studio puts its choices beside the preview. */}
      <DialogContent
        ref={contentRef}
        tabIndex={-1}
        style={fontStyle}
        className='light flex h-dvh max-h-dvh w-full max-w-full flex-col gap-0 rounded-none border-0 p-0 text-foreground sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-2rem)] sm:max-w-3xl sm:rounded-2xl sm:border'
        onOpenAutoFocus={event => {
          // Radix focuses the first tabbable, which is Copy Link, so Space or Enter would copy the link.
          event.preventDefault();
          contentRef.current?.focus();
        }}
      >
        <DialogHeader className='shrink-0 px-6 pt-6 pr-12 pb-4 text-left'>
          <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2'>
            <DialogTitle className='min-w-32 flex-1 leading-snug'>
              {tShare('title')}
            </DialogTitle>
            <CopyLinkButton url={shareUrl} size='sm' />
          </div>
          <DialogDescription>{tShare('description')}</DialogDescription>
        </DialogHeader>
        <div className='min-h-0 flex-1 overflow-y-auto px-6 pb-6'>
          <StudioErrorBoundary
            fallback={
              <p
                role='alert'
                className='py-8 text-center text-sm text-muted-foreground'
              >
                {t('loadError')}
              </p>
            }
          >
            <ShareImagesDialogBody
              fundraiser={fundraiser}
              fitHeight={STUDIO_FIT_HEIGHT}
            />
          </StudioErrorBoundary>
        </div>
      </DialogContent>
    </Dialog>
  );
}

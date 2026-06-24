'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink, Play } from 'lucide-react';
import { COOKIE_CATEGORIES } from '@/lib/constants/cookie-consent-config';
import { cookieConsent } from '@/lib/cookie-consent';
import { useConsent } from '@/lib/hooks/use-consent';
import { cn } from '@/lib/utils/cn';
import {
  ASPECT_CLASS,
  ASPECT_CONTAINER,
  buildEmbedUrl,
  buildWatchUrl,
  isValidVideo,
  normalizeAspect,
} from '@/lib/video/parse-video-url';

interface VideoEmbedProps {
  provider: string;
  id: string;
  /** '16:9' (default) | '9:16' | '1:1'. Untrusted values fall back to 16:9. */
  aspect?: string;
  className?: string;
}

// Capabilities granted to the (trusted, hardcoded-origin) embed iframe. The
// origin is never user-controlled — only a validated id reaches the URL — so
// the sandbox is defense-in-depth on top of that guarantee.
const IFRAME_SANDBOX =
  'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox';
const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';

/**
 * Renders an embedded video from a validated provider + id.
 *
 * YouTube embeds set tracking cookies, so they are gated behind the
 * `externalMedia` consent category: without consent we show only a link plus a
 * button to enable video cookies (no request to Google is made until then).
 * Cloudflare Stream is privacy-friendly and plays immediately.
 */
export function VideoEmbed({
  provider,
  id,
  aspect,
  className,
}: VideoEmbedProps) {
  const t = useTranslations('Common.videoEmbed');
  const mediaConsented = useConsent(COOKIE_CATEGORIES.EXTERNAL_MEDIA);

  // Re-validate at render time: a corrupt or hostile stored marker renders
  // nothing rather than reaching an embed URL.
  if (!isValidVideo(provider, id)) return null;

  const ratio = normalizeAspect(aspect);
  const isGated = provider === 'youtube' && !mediaConsented;

  if (isGated) {
    return (
      <div
        className={cn(
          'my-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 px-6 py-10 text-center',
          ASPECT_CONTAINER[ratio],
          className
        )}
      >
        <span className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
          <Play className='h-5 w-5 text-muted-foreground' aria-hidden='true' />
        </span>
        <p className='max-w-sm text-sm text-muted-foreground'>
          {t('gatedDescription')}
        </p>
        <div className='flex flex-col items-center gap-2'>
          <button
            type='button'
            onClick={() =>
              cookieConsent.accept(COOKIE_CATEGORIES.EXTERNAL_MEDIA)
            }
            // Match the fundraiser theme accent (set as --accent-color by
            // ThemeShell), falling back to the primary colour outside a theme.
            style={{
              backgroundColor: 'var(--accent-color, hsl(var(--primary)))',
            }}
            className='inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          >
            {t('allowButton')}
          </button>
          <a
            href={buildWatchUrl('youtube', id)}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:underline'
          >
            {t('watchOnYoutube')}
            <ExternalLink className='h-3 w-3' aria-hidden='true' />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative my-4 w-full overflow-hidden rounded-xl bg-black',
        ASPECT_CLASS[ratio],
        ASPECT_CONTAINER[ratio],
        className
      )}
    >
      <iframe
        src={buildEmbedUrl(provider, id)}
        title={t('playerTitle')}
        className='absolute inset-0 h-full w-full border-0'
        loading='lazy'
        referrerPolicy='strict-origin-when-cross-origin'
        sandbox={IFRAME_SANDBOX}
        allow={IFRAME_ALLOW}
        allowFullScreen
      />
    </div>
  );
}

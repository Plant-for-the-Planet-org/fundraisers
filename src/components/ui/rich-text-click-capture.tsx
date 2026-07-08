'use client';

import type { MouseEvent } from 'react';
import type { SafeHtml } from '@/lib/types/safe-html';

import { cn } from '@/lib/utils';
import { isWhitelistedHref, openInNewTab } from '@/lib/utils/link-intent';
import {
  hasVideoMarker,
  splitVideoMarkers,
} from '@/lib/video/split-video-markers';
import { showPopupBlockedToast } from '@/components/ui/popup-blocked-toast';
import { VideoEmbed } from '@/components/ui/video-embed';

interface RichTextClickCaptureProps {
  safeHtml: SafeHtml;
  className?: string;
}

/**
 * Renders already-sanitized rich-text HTML and intercepts clicks on any `<a>`.
 * A trusted-domain link opens directly in a new tab; everything else (an
 * untrusted domain, `mailto:`, `tel:`) opens the `/external` warning page in a
 * new tab instead, so the fundraiser page itself is never interrupted. Split
 * out from `RichTextContent` because it needs client-side interactivity,
 * while `RichTextContent` itself must stay usable from Server Components that
 * pass a plain `sanitize` function prop.
 */
export function RichTextClickCapture({
  safeHtml,
  className,
}: RichTextClickCaptureProps) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!href) return;
    event.preventDefault();

    if (isWhitelistedHref(href)) {
      if (!openInNewTab(href)) showPopupBlockedToast(href);
      return;
    }

    // Not trusted (or mailto/tel, which have no domain to trust) — route
    // through the warning page instead of the raw destination, so the
    // popup-blocked fallback link still goes through the same gate.
    const externalUrl = `/external?url=${encodeURIComponent(href)}`;
    if (!openInNewTab(externalUrl)) showPopupBlockedToast(externalUrl);
  };

  // Fast path: no video markers → single node, byte-identical to before.
  if (!hasVideoMarker(safeHtml)) {
    return (
      <div
        className={cn(className)}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: safeHtml as TrustedHTML }}
      />
    );
  }

  return (
    <div className={className} onClick={handleClick}>
      {splitVideoMarkers(safeHtml).map((segment, index) =>
        segment.kind === 'video' ? (
          <VideoEmbed
            key={index}
            provider={segment.provider}
            id={segment.id}
            aspect={segment.aspect}
          />
        ) : (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: segment.html as TrustedHTML }}
          />
        )
      )}
    </div>
  );
}

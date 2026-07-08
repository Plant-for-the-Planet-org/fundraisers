'use client';

import type { MouseEvent } from 'react';
import type { SafeHtml } from '@/lib/types/safe-html';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  hasEmbedMarker,
  splitEmbedMarkers,
} from '@/lib/rich-text/split-embed-markers';
import { ExternalLinkWarningDialog } from '@/components/ui/external-link-warning-dialog';
import { ImageEmbed } from '@/components/ui/image-embed';
import { VideoEmbed } from '@/components/ui/video-embed';

interface RichTextClickCaptureProps {
  safeHtml: SafeHtml;
  className?: string;
}

/**
 * Renders already-sanitized rich-text HTML and intercepts clicks on any `<a>`
 * so every outbound link goes through the external-redirect warning first.
 * Split out from `RichTextContent` because it needs client-side state (the
 * pending link + dialog), while `RichTextContent` itself must stay usable
 * from Server Components that pass a plain `sanitize` function prop.
 */
export function RichTextClickCapture({
  safeHtml,
  className,
}: RichTextClickCaptureProps) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest('a');
    const href = anchor?.getAttribute('href');
    if (!href) return;
    event.preventDefault();
    setPendingHref(href);
  };

  const dialog = (
    <ExternalLinkWarningDialog
      href={pendingHref}
      onOpenChange={open => {
        if (!open) setPendingHref(null);
      }}
    />
  );

  // Fast path: no embed markers → single node, byte-identical to before.
  if (!hasEmbedMarker(safeHtml)) {
    return (
      <>
        <div
          className={cn(className)}
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: safeHtml as TrustedHTML }}
        />
        {dialog}
      </>
    );
  }

  return (
    <>
      <div className={className} onClick={handleClick}>
        {splitEmbedMarkers(safeHtml).map((segment, index) => {
          if (segment.kind === 'video') {
            return (
              <VideoEmbed
                key={index}
                provider={segment.provider}
                id={segment.id}
                aspect={segment.aspect}
              />
            );
          }
          if (segment.kind === 'image') {
            return (
              <ImageEmbed key={index} src={segment.src} alt={segment.alt} />
            );
          }
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{ __html: segment.html as TrustedHTML }}
            />
          );
        })}
      </div>
      {dialog}
    </>
  );
}

'use client';

import type { MouseEvent } from 'react';
import type { SafeHtml } from '@/lib/types/safe-html';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  hasVideoMarker,
  splitVideoMarkers,
} from '@/lib/video/split-video-markers';
import { ExternalLinkWarningDialog } from '@/components/ui/external-link-warning-dialog';
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

  // Fast path: no video markers → single node, byte-identical to before.
  if (!hasVideoMarker(safeHtml)) {
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
      {dialog}
    </>
  );
}

import type { SafeHtml } from '@/lib/types/safe-html';

import {
  hasEmbedMarker,
  splitEmbedMarkers,
} from '@/lib/rich-text/split-embed-markers';
import { cn } from '@/lib/utils';
import { ImageEmbed } from '@/components/ui/image-embed';
import { VideoEmbed } from '@/components/ui/video-embed';

// Discriminated for safety: a raw string without a `sanitize` fn is a compile error, not a silent XSS vulnerability
type RichTextContentProps = {
  className?: string;
} & (
  | {
      /** Raw (untrusted) HTML. Requires `sanitize`. */
      html: string | null | undefined;
      sanitize: (dirty: string) => SafeHtml;
    }
  | {
      /** Already-sanitized HTML. `sanitize` must be omitted. */
      html: SafeHtml | null | undefined;
      sanitize?: never;
    }
);

/**
 * Renders sanitized rich-text HTML, replacing each embed marker with a live
 * component: `<video-embed>` becomes a `<VideoEmbed>` player, `<image-embed>` an
 * `<ImageEmbed>`. HTML segments render via `dangerouslySetInnerHTML` so the
 * markup is SSR-friendly (and so plain descriptions stay byte-identical to
 * before this feature). The iframe is built by `VideoEmbed` from the
 * re-validated id and the `<img>` by `ImageEmbed` from the re-validated src —
 * never from stored HTML. Splitting lives in `splitEmbedMarkers`.
 */
export function RichTextContent({
  html,
  sanitize,
  className,
}: RichTextContentProps) {
  if (!html) return null;

  const safeHtml = sanitize ? sanitize(html) : (html as string);

  // Fast path: no embed markers → single node, byte-identical to before.
  if (!hasEmbedMarker(safeHtml)) {
    return (
      <div
        className={cn(className)}
        dangerouslySetInnerHTML={{ __html: safeHtml as TrustedHTML }}
      />
    );
  }

  return (
    <div className={className}>
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
          return <ImageEmbed key={index} src={segment.src} alt={segment.alt} />;
        }
        return (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: segment.html as TrustedHTML }}
          />
        );
      })}
    </div>
  );
}

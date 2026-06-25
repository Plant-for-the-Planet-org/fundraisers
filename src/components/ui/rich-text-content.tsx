import type { SafeHtml } from '@/lib/types/safe-html';

import { cn } from '@/lib/utils/cn';
import {
  hasVideoMarker,
  splitVideoMarkers,
} from '@/lib/video/split-video-markers';
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
 * Renders sanitized rich-text HTML, replacing each `<video-embed>` marker with
 * a live `<VideoEmbed>` player. HTML segments render via `dangerouslySetInnerHTML`
 * so the markup is SSR-friendly (and so plain descriptions stay byte-identical
 * to before this feature). The iframe is built by `VideoEmbed` from the
 * re-validated id — never from stored HTML. Splitting lives in
 * `splitVideoMarkers`.
 */
export function RichTextContent({
  html,
  sanitize,
  className,
}: RichTextContentProps) {
  if (!html) return null;

  const safeHtml = sanitize ? sanitize(html) : (html as string);

  // Fast path: no video markers → single node, byte-identical to before.
  if (!hasVideoMarker(safeHtml)) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: safeHtml as TrustedHTML }}
      />
    );
  }

  return (
    <div className={cn(className)}>
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

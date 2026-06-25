import type { ReactNode } from 'react';
import type { SafeHtml } from '@/lib/types/safe-html';

import { cn } from '@/lib/utils/cn';
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

// Matches the inert marker the editor stores for a video. The marker is always
// a top-level block (it sits between paragraphs), so splitting the string here
// never breaks inline formatting.
// Non-global so `.test()` never mutates a shared `lastIndex` between renders.
const VIDEO_MARKER_PATTERN = /<video-embed\b[^>]*><\/video-embed>/i;
const PROVIDER_ATTR_PATTERN = /data-video-provider="([^"]*)"/i;
const ID_ATTR_PATTERN = /data-video-id="([^"]*)"/i;
const ASPECT_ATTR_PATTERN = /data-video-aspect="([^"]*)"/i;

/**
 * Renders sanitized rich-text HTML, replacing each `<video-embed>` marker with
 * a live `<VideoEmbed>` player. Text segments render via `dangerouslySetInnerHTML`
 * so the markup is SSR-friendly (and so plain descriptions stay byte-identical
 * to before this feature). The iframe is built by `VideoEmbed` from the
 * re-validated id — never from stored HTML.
 */
export function RichTextContent({
  html,
  sanitize,
  className,
}: RichTextContentProps) {
  if (!html) return null;

  const safeHtml = sanitize ? sanitize(html) : (html as string);

  // Fast path: no video markers → render exactly as before.
  if (!VIDEO_MARKER_PATTERN.test(safeHtml)) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: safeHtml as TrustedHTML }}
      />
    );
  }

  const parts: ReactNode[] = [];
  const regex = new RegExp(VIDEO_MARKER_PATTERN.source, 'gi');
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(safeHtml)) !== null) {
    const before = safeHtml.slice(lastIndex, match.index);
    if (before) {
      parts.push(
        <div
          key={key++}
          dangerouslySetInnerHTML={{ __html: before as TrustedHTML }}
        />
      );
    }

    const tag = match[0];
    const provider = PROVIDER_ATTR_PATTERN.exec(tag)?.[1] ?? '';
    const id = ID_ATTR_PATTERN.exec(tag)?.[1] ?? '';
    const aspect = ASPECT_ATTR_PATTERN.exec(tag)?.[1] ?? '';
    parts.push(
      <VideoEmbed key={key++} provider={provider} id={id} aspect={aspect} />
    );

    lastIndex = regex.lastIndex;
  }

  const rest = safeHtml.slice(lastIndex);
  if (rest) {
    parts.push(
      <div
        key={key++}
        dangerouslySetInnerHTML={{ __html: rest as TrustedHTML }}
      />
    );
  }

  return <div className={cn(className)}>{parts}</div>;
}

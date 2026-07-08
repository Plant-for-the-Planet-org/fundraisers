import type { SafeHtml } from '@/lib/types/safe-html';

import { RichTextClickCapture } from '@/components/ui/rich-text-click-capture';

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
 * Sanitizes rich-text HTML (this part can run in a Server Component, since
 * `sanitize` is a plain synchronous function) and hands the resulting string
 * to `RichTextClickCapture`, a Client Component, for actual rendering. That
 * split exists because `sanitize` is a function prop — functions can't cross
 * the Server → Client boundary, but the sanitized string can.
 *
 * Embed markers (`<video-embed>`, `<image-embed>`) become live components there
 * too, since the split has to happen wherever the HTML is rendered.
 */
export function RichTextContent({
  html,
  sanitize,
  className,
}: RichTextContentProps) {
  if (!html) return null;

  const safeHtml = sanitize ? sanitize(html) : (html as SafeHtml);

  return <RichTextClickCapture safeHtml={safeHtml} className={className} />;
}

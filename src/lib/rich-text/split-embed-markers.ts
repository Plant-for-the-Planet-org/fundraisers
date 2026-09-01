// Splits rich-text HTML into ordered segments — raw HTML runs and embed markers
// — so `RichTextClickCapture` can render each HTML run via
// `dangerouslySetInnerHTML` and each marker as a live `<VideoEmbed>` /
// `<ImageEmbed>`. Pure and SSR-safe; no React deps.
//
// One splitter handles every marker kind on purpose. A marker left unsplit
// stays inside an HTML run, where the browser renders the unknown element as an
// empty inline box — the embed silently disappears. So any new marker tag added
// to `sanitize-html.ts` must be added here too.

export type RichTextSegment =
  | { kind: 'html'; html: string }
  | { kind: 'video'; provider: string; id: string; aspect: string }
  | { kind: 'image'; src: string; alt: string };

// Matches one stored embed marker, e.g.
//   <video-embed data-video-provider="youtube" data-video-id="..."></video-embed>
//   <image-embed data-image-src="https://..."></image-embed>
//
// Three things to know about this pattern:
// 1. It only matches the PAIRED form (`<video-embed ...></video-embed>`), not a self-closing `<video-embed/>`. The marker is written by the TipTap node's renderHTML and passed through sanitize-html unchanged; both emit the paired form today. If a TipTap or sanitize-html upgrade ever switches to self-closing, this stops matching and embeds silently render as nothing — update the pattern here when upgrading either.
// 2. `[^>]*` skips the attributes. A marker is always its own top-level block (it sits between paragraphs), so splitting the HTML on it can't break inline formatting.
// 3. It is intentionally non-global: a `/g` regex keeps a `lastIndex` between `.test()` calls, making repeated checks flip-flop. `splitEmbedMarkers` builds its own global copy for iteration instead.
const EMBED_MARKER_PATTERN = /<(video-embed|image-embed)\b[^>]*><\/\1>/i;

const PROVIDER_ATTR_PATTERN = /data-video-provider="([^"]*)"/i;
const ID_ATTR_PATTERN = /data-video-id="([^"]*)"/i;
const ASPECT_ATTR_PATTERN = /data-video-aspect="([^"]*)"/i;
const IMAGE_SRC_ATTR_PATTERN = /data-image-src="([^"]*)"/i;
const IMAGE_ALT_ATTR_PATTERN = /data-image-alt="([^"]*)"/i;

/**
 * Undo the HTML-escaping `sanitize-html` applies to attribute values. Needed
 * because an image URL can legitimately carry a query string, whose `&`
 * separators come back as `&amp;` — left encoded, the URL would not resolve.
 * `&amp;` is decoded last so `&amp;quot;` doesn't turn into a real quote.
 */
function decodeAttrValue(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Whether the HTML contains at least one embed marker (cheap fast-path check). */
export function hasEmbedMarker(html: string): boolean {
  return EMBED_MARKER_PATTERN.test(html);
}

/**
 * Split rich-text HTML into ordered segments. Empty HTML runs are omitted, so
 * adjacent markers (or a marker at the start/end) don't yield blank segments.
 * Marker attributes are read verbatim; `VideoEmbed` / `ImageEmbed` re-validate
 * them, so a malformed marker fails safe at render rather than here.
 */
export function splitEmbedMarkers(html: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  // Fresh global regex so iteration's `lastIndex` is local to this call.
  const regex = new RegExp(EMBED_MARKER_PATTERN.source, 'gi');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const before = html.slice(lastIndex, match.index);
    if (before) segments.push({ kind: 'html', html: before });

    const marker = match[0];
    if (match[1].toLowerCase() === 'image-embed') {
      segments.push({
        kind: 'image',
        src: decodeAttrValue(IMAGE_SRC_ATTR_PATTERN.exec(marker)?.[1] ?? ''),
        alt: decodeAttrValue(IMAGE_ALT_ATTR_PATTERN.exec(marker)?.[1] ?? ''),
      });
    } else {
      segments.push({
        kind: 'video',
        provider: PROVIDER_ATTR_PATTERN.exec(marker)?.[1] ?? '',
        id: ID_ATTR_PATTERN.exec(marker)?.[1] ?? '',
        aspect: ASPECT_ATTR_PATTERN.exec(marker)?.[1] ?? '',
      });
    }

    lastIndex = regex.lastIndex;
  }

  const rest = html.slice(lastIndex);
  if (rest) segments.push({ kind: 'html', html: rest });

  return segments;
}

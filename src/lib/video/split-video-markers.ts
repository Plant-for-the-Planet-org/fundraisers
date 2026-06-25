// Splits rich-text HTML into ordered segments — raw HTML runs and video markers
// — so `RichTextContent` can render each HTML run via `dangerouslySetInnerHTML`
// and each marker as a live `<VideoEmbed>`. Pure and SSR-safe; no React deps.

export type RichTextSegment =
  | { kind: 'html'; html: string }
  | { kind: 'video'; provider: string; id: string; aspect: string };

// Matches one stored video marker, e.g.
//   <video-embed data-video-provider="youtube" data-video-id="..."></video-embed>
//
// Three things to know about this pattern:
// 1. It only matches the PAIRED form (`<video-embed ...></video-embed>`), not a self-closing `<video-embed/>`. The marker is written by the TipTap node's renderHTML and passed through sanitize-html unchanged; both emit the paired form today. If a TipTap or sanitize-html upgrade ever switches to self-closing, this stops matching and videos silently render as nothing — update the pattern here when upgrading either.
// 2. `[^>]*` skips the attributes. The marker is always its own top-level block (it sits between paragraphs), so splitting the HTML on it can't break inline formatting.
// 3. It is intentionally non-global: a `/g` regex keeps a `lastIndex` between `.test()` calls, making repeated checks flip-flop. `splitVideoMarkers` builds its own global copy for iteration instead.
const VIDEO_MARKER_PATTERN = /<video-embed\b[^>]*><\/video-embed>/i;
const PROVIDER_ATTR_PATTERN = /data-video-provider="([^"]*)"/i;
const ID_ATTR_PATTERN = /data-video-id="([^"]*)"/i;
const ASPECT_ATTR_PATTERN = /data-video-aspect="([^"]*)"/i;

/** Whether the HTML contains at least one video marker (cheap fast-path check). */
export function hasVideoMarker(html: string): boolean {
  return VIDEO_MARKER_PATTERN.test(html);
}

/**
 * Split rich-text HTML into ordered segments. Empty HTML runs are omitted, so
 * adjacent markers (or a marker at the start/end) don't yield blank segments.
 * Marker attributes are read verbatim; `VideoEmbed` re-validates them, so a
 * malformed marker fails safe at render rather than here.
 */
export function splitVideoMarkers(html: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  // Fresh global regex so iteration's `lastIndex` is local to this call.
  const regex = new RegExp(VIDEO_MARKER_PATTERN.source, 'gi');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const before = html.slice(lastIndex, match.index);
    if (before) segments.push({ kind: 'html', html: before });

    const marker = match[0];
    segments.push({
      kind: 'video',
      provider: PROVIDER_ATTR_PATTERN.exec(marker)?.[1] ?? '',
      id: ID_ATTR_PATTERN.exec(marker)?.[1] ?? '',
      aspect: ASPECT_ATTR_PATTERN.exec(marker)?.[1] ?? '',
    });

    lastIndex = regex.lastIndex;
  }

  const rest = html.slice(lastIndex);
  if (rest) segments.push({ kind: 'html', html: rest });

  return segments;
}

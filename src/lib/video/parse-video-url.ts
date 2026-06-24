/**
 * Video embed parsing + URL building.
 *
 * Security model: we NEVER store or trust an iframe. A pasted URL is parsed
 * here into a `{ provider, id }` pair, where the host is checked against a
 * fixed allowlist and the id against a strict charset. The id is the only
 * dynamic value that ever reaches an embed URL, and it is interpolated into a
 * hardcoded template (see `buildEmbedUrl`). Anything that does not parse to a
 * known provider + valid id is rejected — it never becomes an embed.
 *
 * Mirrors the hostname-suffix allowlist approach already used for image URLs
 * in `fundraiser-form-schema.ts` (`isAllowedImageUrl`).
 */

export type VideoProvider = 'youtube' | 'cloudflare';

export type VideoAspect = '16:9' | '9:16' | '1:1';

export const VIDEO_ASPECTS: VideoAspect[] = ['16:9', '9:16', '1:1'];

// Tailwind classes per aspect. Kept as literals so the JIT picks them up.
export const ASPECT_CLASS: Record<VideoAspect, string> = {
  '16:9': 'aspect-video',
  '9:16': 'aspect-[9/16]',
  '1:1': 'aspect-square',
};

// Portrait/square videos are width-capped and centred so they don't dominate.
export const ASPECT_CONTAINER: Record<VideoAspect, string> = {
  '16:9': '',
  '9:16': 'mx-auto w-full max-w-[360px]',
  '1:1': 'mx-auto w-full max-w-md',
};

/** Coerce an untrusted stored value to a known aspect, defaulting to 16:9. */
export function normalizeAspect(value: string | null | undefined): VideoAspect {
  return VIDEO_ASPECTS.includes(value as VideoAspect)
    ? (value as VideoAspect)
    : '16:9';
}

export interface ParsedVideo {
  provider: VideoProvider;
  /** YouTube: 11-char video id. Cloudflare: 32-char hex stream uid. */
  id: string;
  /**
   * Best-effort default aspect. YouTube's player is always 16:9 and neither
   * oEmbed nor the Data API exposes the true source aspect, so the only
   * reliable signal is the URL type: Shorts are vertical. Everything else
   * defaults to 16:9 and can be overridden by the creator.
   */
  aspect: VideoAspect;
}

// Exact hostnames we accept a link from, per provider. Suffix matching is done
// against `.${suffix}` so `youtube.com.evil.com` can never match.
const YOUTUBE_HOSTS = [
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
] as const;

const CLOUDFLARE_HOSTS = ['cloudflarestream.com', 'videodelivery.net'] as const;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const CLOUDFLARE_ID = /^[a-f0-9]{32}$/;

function hostMatches(host: string, allowed: readonly string[]): boolean {
  const h = host.toLowerCase();
  return allowed.some(suffix => h === suffix || h.endsWith(`.${suffix}`));
}

function extractYoutubeId(url: URL): string | null {
  // youtu.be/<id>
  if (url.hostname.toLowerCase().endsWith('youtu.be')) {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id && YOUTUBE_ID.test(id) ? id : null;
  }

  // youtube.com/watch?v=<id>
  const v = url.searchParams.get('v');
  if (v && YOUTUBE_ID.test(v)) return v;

  // youtube.com/embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
  const segments = url.pathname.split('/').filter(Boolean);
  const prefixIndex = segments.findIndex(s =>
    ['embed', 'shorts', 'live', 'v'].includes(s)
  );
  if (prefixIndex !== -1) {
    const id = segments[prefixIndex + 1];
    if (id && YOUTUBE_ID.test(id)) return id;
  }

  return null;
}

function extractCloudflareId(url: URL): string | null {
  // The 32-char hex uid appears as a path segment in every Cloudflare Stream
  // URL form: iframe.cloudflarestream.com/<uid>, customer-x.cloudflarestream.com/<uid>/iframe,
  // videodelivery.net/<uid>/manifest/video.m3u8, watch.cloudflarestream.com/<uid>, ...
  const segment = url.pathname
    .split('/')
    .filter(Boolean)
    .find(s => CLOUDFLARE_ID.test(s));
  return segment ?? null;
}

/**
 * Parse a user-supplied URL into a known provider + validated id, or `null`.
 * Rejects non-http(s) schemes, unknown hosts, and malformed ids.
 */
export function parseVideoUrl(raw: string): ParsedVideo | null {
  if (!raw || typeof raw !== 'string') return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  if (hostMatches(url.hostname, YOUTUBE_HOSTS)) {
    const id = extractYoutubeId(url);
    if (!id) return null;
    const aspect: VideoAspect = /\/shorts\//i.test(url.pathname)
      ? '9:16'
      : '16:9';
    return { provider: 'youtube', id, aspect };
  }

  if (hostMatches(url.hostname, CLOUDFLARE_HOSTS)) {
    const id = extractCloudflareId(url);
    return id ? { provider: 'cloudflare', id, aspect: '16:9' } : null;
  }

  return null;
}

/**
 * Re-validate a stored `{ provider, id }` pair. Used at render time before
 * building an embed URL, so corrupt/hostile stored markers render nothing.
 */
export function isValidVideo(
  provider: string,
  id: string
): provider is VideoProvider {
  if (provider === 'youtube') return YOUTUBE_ID.test(id);
  if (provider === 'cloudflare') return CLOUDFLARE_ID.test(id);
  return false;
}

/** Build the privacy-respecting embed URL. Only a validated id is interpolated. */
export function buildEmbedUrl(provider: VideoProvider, id: string): string {
  if (provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  return `https://iframe.cloudflarestream.com/${id}`;
}

/** Build the public watch/landing URL (used for the no-consent fallback link). */
export function buildWatchUrl(provider: VideoProvider, id: string): string {
  if (provider === 'youtube') {
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return `https://cloudflarestream.com/${id}`;
}

/** Thumbnail used for editor previews and the gated fallback panel. */
export function buildThumbnailUrl(provider: VideoProvider, id: string): string {
  if (provider === 'youtube') {
    return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }
  return `https://videodelivery.net/${id}/thumbnails/thumbnail.jpg`;
}

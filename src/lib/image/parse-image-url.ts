/**
 * Image embed parsing.
 *
 * Security model, and how it differs from video: a video marker stores only
 * `{ provider, id }` and the embed URL is rebuilt from a hardcoded template, so
 * no stored value ever reaches the output verbatim. An image has no such
 * template — the URL *is* the content — so the stored `data-image-src` is the
 * one place a full URL is kept. `sanitize-html` cannot pattern-check a `data-*`
 * value (its scheme checks only cover `href`/`src`/`cite`), which makes the
 * render-time `normalizeImageSrc` call in `ImageEmbed` the real gate, exactly as
 * `isValidVideo` is for video. Both authoring and render run the same check, so
 * a corrupt or hostile stored marker renders nothing.
 *
 * The host allowlist is `ALLOWED_IMAGE_HOSTNAME_SUFFIXES` — the same list the
 * fundraiser form already checks user-entered image URLs against on save. One
 * list, so "approved image host" means the same thing everywhere in the app.
 * `isAllowedImageUrl` itself is deliberately not reused: it returns `true` for
 * an empty string (it guards optional form fields), which is the wrong default
 * for a gate that decides whether to render.
 */

import { ALLOWED_IMAGE_HOSTNAME_SUFFIXES } from '@/lib/utils/image-url';

// Extensions used only to *recognise* a pasted URL as an image (see
// `looksLikeImageUrl`). Not a render-time requirement: the approved CDNs serve
// extensionless URLs (an Unsplash link is `/photo-<id>?ixlib=...`), so demanding
// an extension everywhere would reject most approved-host images.
//
// `svg` is absent on purpose. Browsers disable scripting in an SVG loaded
// through `<img>`, so it would not be an XSS vector here, but the approved list
// includes `amazonaws.com` — any S3 bucket, including one an attacker controls
// — and nothing needs SVG, so the auto-recognising path stays raster-only.
const IMAGE_EXT_PATTERN = /\.(png|jpe?g|gif|webp|avif)$/i;

export interface ParsedImage {
  /** The validated, absolute https URL. */
  src: string;
}

function hostMatches(host: string, allowedHosts: readonly string[]): boolean {
  const h = host.toLowerCase();
  return allowedHosts.some(suffix => h === suffix || h.endsWith(`.${suffix}`));
}

/**
 * The single gate: returns the URL to actually use if it may be shown as an
 * embedded image (absolute `https`, on an approved image host), or `null`.
 *
 * It returns the *parsed* URL rather than a boolean on purpose, so callers
 * render the exact string that was validated. A boolean check invites the
 * caller to render the original, and the two can disagree: `String.trim()`
 * strips the whole Unicode whitespace set, while the URL parser a browser
 * applies to `img src` strips only C0 controls and space. A leading NBSP would
 * therefore validate as an absolute approved-host URL while the browser
 * resolved it as a *relative* path against the fundraiser page.
 */
export function normalizeImageSrc(src: string): string | null {
  if (!src || typeof src !== 'string') return null;

  let url: URL;
  try {
    url = new URL(src.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (!hostMatches(url.hostname, ALLOWED_IMAGE_HOSTNAME_SUFFIXES)) return null;
  return url.href;
}

/**
 * Parse a URL the host explicitly asked to embed (the toolbar's image row) into
 * an embeddable image, or `null`. No extension requirement — the intent is
 * explicit, and approved CDNs serve extensionless image URLs.
 */
export function parseImageUrl(raw: string): ParsedImage | null {
  const src = normalizeImageSrc(raw);
  return src ? { src } : null;
}

/**
 * Whether a *pasted* URL should be turned into an image on its own. Stricter
 * than `parseImageUrl`: it also requires a recognisable image extension,
 * because a paste is ambiguous. Without that check, pasting any approved-host
 * link (a project page on plant-for-the-planet.org, say) would silently become
 * a broken image instead of a link.
 */
export function looksLikeImageUrl(raw: string): ParsedImage | null {
  const parsed = parseImageUrl(raw);
  if (!parsed) return null;
  return IMAGE_EXT_PATTERN.test(new URL(parsed.src).pathname) ? parsed : null;
}

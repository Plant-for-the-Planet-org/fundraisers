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
 * Hosts are `TRUSTED_DOMAINS` — the same list that decides which links skip the
 * `/external` redirect warning. One list, so "a domain we trust" means the same
 * thing whether a donor clicks through to it or a description loads an image
 * from it.
 *
 * Deliberately NOT `ALLOWED_IMAGE_HOSTNAME_SUFFIXES` from
 * `src/lib/utils/image-url.ts`: that list includes third-party hosts (Unsplash,
 * Cloudinary, AWS, imgix, Google) because it governs images a host picks through
 * our own UI — theme backgrounds, the Unsplash picker — which is a different
 * question from a URL typed into copy shown to every donor. No third-party image
 * hosts here.
 */

import { isWhitelistedHostname } from '@/lib/constants/trusted-domains';

// Extensions used only to *recognise* a pasted URL as an image (see
// `looksLikeImageUrl`), never as a render-time requirement — our own CDN may
// serve an image from an extensionless path.
const IMAGE_EXT_PATTERN = /\.(png|jpe?g|gif|webp|avif)$/i;

// SVG is rejected on every path. An SVG loaded through `<img>` cannot run
// script, so this closes no XSS hole — it keeps embedded images to raster
// formats, which is all a fundraiser description needs.
//
// The limit of this check: it can only see the path. An extensionless URL that
// happens to serve `image/svg+xml` still gets through, because deciding that
// would mean fetching the URL. Detecting what we can see is the trade.
//
// Do not "simplify" this away by reading the paste-only extension filter as the
// whole policy — rejecting SVG here is deliberate, and covers a stored marker
// written straight through the API as well.
const SVG_EXT_PATTERN = /\.svgz?$/i;

export interface ParsedImage {
  /** The validated, absolute https URL. */
  src: string;
}

/**
 * The single gate: returns the URL to actually use if it may be shown as an
 * embedded image (absolute `https`, on a trusted domain, not an SVG), or `null`.
 *
 * It returns the *parsed* URL rather than a boolean on purpose, so callers
 * render the exact string that was validated. A boolean check invites the
 * caller to render the original, and the two can disagree: `String.trim()`
 * strips the whole Unicode whitespace set, while the URL parser a browser
 * applies to `img src` strips only C0 controls and space. A leading NBSP would
 * therefore validate as an absolute trusted-domain URL while the browser
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
  // `hostname` from the URL parser is already lowercased, which is what
  // `isWhitelistedHostname` expects.
  if (!isWhitelistedHostname(url.hostname)) return null;
  if (SVG_EXT_PATTERN.test(url.pathname)) return null;
  return url.href;
}

/**
 * Host/scheme/SVG check without the extension requirement. Internal: with no
 * toolbar insert path, `looksLikeImageUrl` is the only authoring entry point.
 */
function parseImageUrl(raw: string): ParsedImage | null {
  const src = normalizeImageSrc(raw);
  return src ? { src } : null;
}

/**
 * Whether a *pasted* URL should be turned into an image on its own. Stricter
 * than `parseImageUrl`: it also requires a recognisable image extension,
 * because a paste is ambiguous and most trusted domains are ordinary websites.
 * Without that check, pasting any plant-for-the-planet.org or startplanting.org
 * page link would silently become a broken image instead of a link.
 */
export function looksLikeImageUrl(raw: string): ParsedImage | null {
  const parsed = parseImageUrl(raw);
  if (!parsed) return null;
  return IMAGE_EXT_PATTERN.test(new URL(parsed.src).pathname) ? parsed : null;
}

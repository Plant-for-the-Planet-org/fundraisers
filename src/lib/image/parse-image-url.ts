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
 * Hosts are Plant-for-the-Planet's own domains, and deliberately NOT
 * `ALLOWED_IMAGE_HOSTNAME_SUFFIXES` from `src/lib/utils/image-url.ts`. That list
 * includes third-party hosts (Unsplash, Cloudinary, AWS, imgix, Google) because
 * it governs images a host picks through our own UI — theme backgrounds, the
 * Unsplash picker — which is a different question from a URL typed into copy
 * shown to every donor. No third-party image hosts here.
 *
 * This list is a placeholder for `TRUSTED_DOMAINS` (the list that decides which
 * links skip the `/external` redirect warning). That constant does not exist on
 * `develop` yet — it arrives with the rich-text-links work — so the two get
 * unified in a follow-up, and "a domain we trust" will mean the same thing
 * whether a donor clicks through to it or a description loads an image from it.
 */

// Accepted host suffixes (subdomains included). Matching is done against
// `.${suffix}` so `plant-for-the-planet.org.evil.com` can never match, while
// real subdomains like `cdn.plant-for-the-planet.org` are covered.
const IMAGE_HOSTS = ['plant-for-the-planet.org'] as const;

// Extensions used only to *recognise* a pasted URL as an image (see
// `looksLikeImageUrl`), never as a render-time requirement — our own CDN may
// serve an image from an extensionless path.
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
 * embedded image (absolute `https`, on an allowed host), or `null`.
 *
 * It returns the *parsed* URL rather than a boolean on purpose, so callers
 * render the exact string that was validated. A boolean check invites the
 * caller to render the original, and the two can disagree: `String.trim()`
 * strips the whole Unicode whitespace set, while the URL parser a browser
 * applies to `img src` strips only C0 controls and space. A leading NBSP would
 * therefore validate as an absolute allowed-host URL while the browser
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
  if (!hostMatches(url.hostname, IMAGE_HOSTS)) return null;
  return url.href;
}

/**
 * Parse a URL the host explicitly asked to embed (the toolbar's image row) into
 * an embeddable image, or `null`. No extension requirement — the intent is
 * explicit, and an image on our own CDN need not have one.
 */
export function parseImageUrl(raw: string): ParsedImage | null {
  const src = normalizeImageSrc(raw);
  return src ? { src } : null;
}

/**
 * Whether a *pasted* URL should be turned into an image on its own. Stricter
 * than `parseImageUrl`: it also requires a recognisable image extension,
 * because a paste is ambiguous. Without that check, pasting an ordinary
 * plant-for-the-planet.org page link would silently become a broken image
 * instead of a link.
 */
export function looksLikeImageUrl(raw: string): ParsedImage | null {
  const parsed = parseImageUrl(raw);
  if (!parsed) return null;
  return IMAGE_EXT_PATTERN.test(new URL(parsed.src).pathname) ? parsed : null;
}

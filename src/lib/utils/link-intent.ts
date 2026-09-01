/**
 * Classifies a link URL into what clicking it will actually do, so the
 * `/external` redirect page can adapt its copy per scheme. Every scheme
 * requires an explicit "Continue" click — nothing auto-fires.
 */

import { isWhitelistedHostname } from '@/lib/constants/trusted-domains';

export type LinkScheme = 'web' | 'mail';

export interface LinkIntent {
  scheme: LinkScheme;
  /** Domain for web links, the raw address otherwise. */
  destination: string;
}

export function getLinkIntent(href: string): LinkIntent {
  if (href.startsWith('mailto:')) {
    return { scheme: 'mail', destination: href.slice('mailto:'.length) };
  }

  let destination = href;
  try {
    destination = new URL(href).hostname;
  } catch {
    // Not a parseable absolute URL — fall back to the raw href as the label.
  }

  return { scheme: 'web', destination };
}

/**
 * Whether a link can skip the `/external` warning gate and open directly.
 * Only HTTPS links to a domain Plant-for-the-Planet owns qualify. Plain HTTP
 * still works, but must go through the `/external` warning first.
 */
export function isWhitelistedHref(href: string): boolean {
  const intent = getLinkIntent(href);
  if (intent.scheme !== 'web') return false;

  try {
    const url = new URL(href);
    return url.protocol === 'https:' && isWhitelistedHostname(url.hostname);
  } catch {
    return false;
  }
}

// Requires at least one label + a dot + a letters-only TLD, e.g. "example.com"
// or "sub.example.co.uk" — rejects a bare word like "asdfasdf" with no dot,
// which `new URL()` alone happily accepts as a "valid" hostname.
const DOMAIN_PATTERN = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

function looksLikeADomain(hostname: string): boolean {
  return DOMAIN_PATTERN.test(hostname);
}

/**
 * Normalizes a link entered without a scheme to an HTTPS URL. Explicit
 * schemes are preserved so the validator can decide whether they are
 * supported.
 */
export function normalizeLinkHref(value: string): string {
  const href = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
  return `https://${href}`;
}

/**
 * Whether a link is a type this app supports at all, with a destination that
 * actually looks real — `http:`/`https:` to a domain-shaped hostname, or
 * `mailto:` to an address whose domain is domain-shaped. Anything else
 * (`tel:`, `javascript:`, `data:`, `file:`, a bare word with no TLD, a bare/
 * relative string, ...) is rejected. This is the single gate shared by the
 * editor (rejects an unsupported/malformed link at entry, before it can ever
 * be saved) and the `/external` page (a defensive backstop, since that route
 * is still directly reachable with an arbitrary query value).
 */
export function isValidExternalHref(href: string): boolean {
  if (href.startsWith('mailto:')) {
    const [addressPart] = href.slice('mailto:'.length).split('?');
    const [firstAddress] = addressPart.split(',');
    const atIndex = firstAddress.lastIndexOf('@');
    if (atIndex === -1) return false;
    return looksLikeADomain(firstAddress.slice(atIndex + 1));
  }

  try {
    const { protocol, hostname } = new URL(href);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return looksLikeADomain(hostname);
  } catch {
    return false;
  }
}

/**
 * TipTap applies this gate to both candidate and stored links. Bare domains
 * must pass here so its defaultProtocol can normalize them before storage.
 */
export function isAllowedEditorLinkHref(href: string): boolean {
  return isValidExternalHref(normalizeLinkHref(href));
}

/** Automatic and pasted links may be bare domains before TipTap stores them. */
export function shouldAutoLinkHref(href: string): boolean {
  return isValidExternalHref(normalizeLinkHref(href));
}

/**
 * Opens a web link in a new tab and reports whether it actually opened.
 * A popup blocker makes `window.open` return null (or an immediately-closed
 * window) — that's the block signal.
 *
 * Note: we must NOT pass `noopener` in the features string. With `noopener`,
 * `window.open` returns null even on SUCCESS (the opener link is severed, so
 * there's no handle to hand back), which reads as a false "blocked". Instead we
 * open normally and sever the opener ourselves via `win.opener = null`, keeping
 * the same security posture while preserving a usable return value.
 */
export function openInNewTab(url: string): boolean {
  const win = window.open(url, '_blank');
  if (!win || win.closed) return false;
  win.opener = null;
  return true;
}

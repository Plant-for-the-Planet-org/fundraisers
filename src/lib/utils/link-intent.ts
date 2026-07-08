/**
 * Classifies a link URL into what clicking it will actually do, so the
 * external-redirect warning can adapt its copy and behaviour per scheme.
 * `web` links auto-open in a new tab after the countdown; `mail`/`tel` only
 * fire on an explicit click (no silent hand-off to another app).
 */

export type LinkScheme = 'web' | 'mail' | 'tel';

export interface LinkIntent {
  scheme: LinkScheme;
  /** Domain for web links, the raw address/number otherwise. */
  destination: string;
  autoFire: boolean;
}

export function getLinkIntent(href: string): LinkIntent {
  if (href.startsWith('mailto:')) {
    return {
      scheme: 'mail',
      destination: href.slice('mailto:'.length),
      autoFire: false,
    };
  }

  if (href.startsWith('tel:')) {
    return {
      scheme: 'tel',
      destination: href.slice('tel:'.length),
      autoFire: false,
    };
  }

  let destination = href;
  try {
    destination = new URL(href).hostname;
  } catch {
    // Not a parseable absolute URL — fall back to the raw href as the label.
  }

  return { scheme: 'web', destination, autoFire: true };
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

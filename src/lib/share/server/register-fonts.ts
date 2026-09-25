import type { FontId } from '@/lib/theme/types';

import { GlobalFonts } from '@napi-rs/canvas';
import { SHARE_FONT_WEIGHTS, SHARE_FONTS } from '../fonts';

import 'server-only';

const registered = new Map<FontId, Promise<void>>();

/**
 * Downloads a theme font from Google Fonts once per server process and registers it with the canvas.
 * Google serves TTF files to a request without a browser user agent, which is what `@napi-rs/canvas` reads.
 * A failed download is dropped from the cache so the next render tries again; that render falls back to a system font.
 */
async function load(font: FontId): Promise<void> {
  const { family } = SHARE_FONTS[font];
  const query = `family=${encodeURIComponent(family)}:wght@${SHARE_FONT_WEIGHTS.join(';')}`;
  const css = await fetch(`https://fonts.googleapis.com/css2?${query}`, {
    signal: AbortSignal.timeout(5000),
  }).then(response => {
    if (!response.ok)
      throw new Error(`Google Fonts responded ${response.status}`);
    return response.text();
  });
  const urls = [...css.matchAll(/src:\s*url\((https:[^)]+\.ttf)\)/g)].map(
    match => match[1]
  );
  if (urls.length === 0) throw new Error(`No TTF files for ${family}`);
  await Promise.all(
    urls.map(async url => {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok)
        throw new Error(`Font file responded ${response.status}`);
      GlobalFonts.register(Buffer.from(await response.arrayBuffer()), family);
    })
  );
}

export async function registerShareFonts(fonts: FontId[]): Promise<void> {
  await Promise.all(
    [...new Set(fonts)].map(font => {
      let pending = registered.get(font);
      if (!pending) {
        pending = load(font).catch(error => {
          registered.delete(font);
          console.warn(`[share-image] Could not load font ${font}:`, error);
        });
        registered.set(font, pending);
      }
      return pending;
    })
  );
}

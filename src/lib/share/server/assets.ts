import type { ShareAssetLoader } from '../render/theme-background';
import type { ShareImage } from '../render/types';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createCanvas, loadImage, Path2D } from '@napi-rs/canvas';
import { fetchAllowedImage } from './fetch-image';

import 'server-only';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function bytesFor(src: string): Promise<Buffer | null> {
  if (src.startsWith('data:')) {
    const comma = src.indexOf(',');
    const header = src.slice(0, comma);
    const body = src.slice(comma + 1);
    return header.includes(';base64')
      ? Buffer.from(body, 'base64')
      : Buffer.from(decodeURIComponent(body));
  }
  if (src.startsWith('/')) {
    // Library assets ship in public/. Resolve inside it only.
    const file = path.join(PUBLIC_DIR, path.normalize(src));
    if (!file.startsWith(PUBLIC_DIR + path.sep)) return null;
    return readFile(file).catch(() => null);
  }
  // Someone else's server: only allowlisted hosts, capped in size, redirects checked.
  const image = await fetchAllowedImage(src, { allowSvg: true });
  return image?.bytes ?? null;
}

// About 40 megapixels; anything bigger is not a photo worth decoding for a 2400px image.
const MAX_PIXELS = 40_000_000;

/** Loads share assets on the server: library files from public/, data URIs, and allowlisted remote images. */
export const serverAssetLoader: ShareAssetLoader = {
  loadImage: async (src: string): Promise<ShareImage | null> => {
    const bytes = await bytesFor(src);
    const image = bytes ? await loadImage(bytes).catch(() => null) : null;
    return image && image.width * image.height <= MAX_PIXELS ? image : null;
  },
  createCanvas: (width, height) => createCanvas(width, height),
};

export const serverMakePath = (d: string) =>
  new Path2D(d) as unknown as globalThis.Path2D;

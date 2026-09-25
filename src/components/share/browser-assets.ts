'use client';

import type { ShareAssetLoader } from '@/lib/share/render/theme-background';
import type { ShareImage } from '@/lib/share/render/types';

function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** An image from one of our routes, sent with the host's token so a draft's images load too. */
export async function fetchImage(
  url: string,
  headers: Record<string, string>
): Promise<HTMLImageElement | null> {
  const response = await fetch(url, { headers }).catch(() => null);
  if (!response?.ok) return null;
  const objectUrl = URL.createObjectURL(await response.blob());
  const image = await loadImageElement(objectUrl);
  // Once decoded, the image draws without its URL.
  URL.revokeObjectURL(objectUrl);
  return image;
}

const createCanvas: ShareAssetLoader['createCanvas'] = (width, height) =>
  Object.assign(document.createElement('canvas'), { width, height });

/**
 * Loads share assets in the browser.
 * Library assets and data URIs are same-origin, so a canvas can draw them and still export. A theme image on another host goes through our photo route instead.
 */
export function browserAssetLoader(
  slug: string,
  headers: Record<string, string>
): ShareAssetLoader {
  return {
    loadImage: (src: string): Promise<ShareImage | null> =>
      /^https?:\/\//i.test(src)
        ? fetchImage(
            `/api/share/photo/${encodeURIComponent(slug)}?asset=background`,
            headers
          )
        : loadImageElement(src),
    createCanvas,
  };
}

/**
 * Loads images from our own routes, such as donor photos, with the host's token so a draft's images load too.
 * Anything that is not a path on our origin loads nothing, so the token never goes to another host.
 */
export function browserRouteLoader(
  headers: Record<string, string>
): ShareAssetLoader {
  return {
    loadImage: async (src: string): Promise<ShareImage | null> =>
      /^\/(?![/\\])/.test(src) ? fetchImage(src, headers) : null,
    createCanvas,
  };
}

export const browserMakePath = (d: string) => new Path2D(d);

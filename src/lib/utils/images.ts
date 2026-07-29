import { CDN_BASE_URL } from '@/lib/constants/app-config';

export type ImageSize = 'thumb' | 'small' | 'medium' | 'large' | 'original';
export type ImageType = 'profile' | 'project' | 'fundraiser';

/**
 * Get CDN image URL
 * @param type - The type of image (profile, project, fundraiser)
 * @param size - The desired image size
 * @param filename - The image filename from the API
 * @returns Complete CDN URL or null if filename is not provided
 */
export function getImageUrl(
  type: ImageType,
  size: ImageSize,
  filename: string | null | undefined
): string | null {
  if (!filename) {
    return null;
  }

  return `${CDN_BASE_URL}/${type}/${size}/${filename}`;
}

/**
 * Resolves a project's image field to a renderable URL. Accepts either a
 * full http(s) URL (returned as-is) or a CDN filename (resolved via
 * `getImageUrl('project', size, …)`). Returns `null` for empty input.
 *
 * @param size - CDN size to request. Defaults to `'small'`, which suits the
 * thumbnails most callers render; pass `'large'` for hero-sized images.
 */
export function resolveProjectImageSource(
  image?: string | null,
  size: ImageSize = 'small'
): string | null {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return getImageUrl('project', size, image);
}

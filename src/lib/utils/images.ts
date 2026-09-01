import { CDN_BASE_URL } from '@/lib/constants/app-config';

/**
 * A size is a LiipImagine filter on the platform, named `<type>_<size>`, and
 * every type defines its own set. Fundraisers have thumb (80), small (320) and
 * large (640) only; asking for a size a type does not define returns a 403.
 */
export type ImageSize = 'thumb' | 'small' | 'medium' | 'large';
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
 * `getImageUrl('project', 'small', …)`). Returns `null` for empty input.
 */
export function resolveProjectImageSource(image?: string): string | null {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return getImageUrl('project', 'small', image);
}

/**
 * Resolves a fundraiser's `image` field to a renderable URL. Accepts either a
 * full http(s) URL (returned as-is) or a CDN filename. Returns `null` for
 * empty input.
 */
export function resolveFundraiserImageSource(
  image: string | null | undefined,
  size: ImageSize = 'large'
): string | null {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return getImageUrl('fundraiser', size, image);
}

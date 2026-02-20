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

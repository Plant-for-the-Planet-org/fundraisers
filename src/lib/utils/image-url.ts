// Image hosts we trust, for user-entered image URLs (stage images, theme backgrounds).
// When a fundraiser is saved, the form checks each image URL against this list, so images can only load from known https hosts.
// This is about trusting the source, not security: these URLs are only shown as <img> or CSS background images, where javascript:/data: URLs can't run code and our server never downloads them.
export const ALLOWED_IMAGE_HOSTNAME_SUFFIXES = [
  'plant-for-the-planet.org',
  'unsplash.com',
  'cloudinary.com',
  'amazonaws.com',
  'imgix.net',
  'googleusercontent.com',
] as const;

export function isAllowedImageUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_IMAGE_HOSTNAME_SUFFIXES.some(
      suffix => host === suffix || host.endsWith(`.${suffix}`)
    );
  } catch {
    return false;
  }
}

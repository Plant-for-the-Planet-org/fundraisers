// Trusted hostnames for user-supplied image URLs (stage images, theme backgrounds).
// Prevents javascript:/data: injection and SSRF by restricting to https + known hosts.
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

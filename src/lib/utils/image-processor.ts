import type { SelectedImage } from '@/lib/types/image-selection';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads an image and returns it as a base64 data URI, the only image form
 * the fundraiser API accepts. Returns `undefined` when the download fails, so
 * callers can carry on without the image rather than losing the whole request.
 * Needs the host to allow cross-origin reads.
 */
export async function fetchImageAsBase64(
  url: string
): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    return await blobToBase64(await response.blob());
  } catch {
    return undefined;
  }
}

export async function imageToBase64(
  image: SelectedImage
): Promise<string | undefined> {
  if (image.source === 'upload' && image.file instanceof File) {
    return blobToBase64(image.file);
  }

  if (image.source === 'unsplash' && image.originalUrl) {
    return fetchImageAsBase64(image.originalUrl);
  }

  return undefined;
}

import type {
  ImageValidationResult,
  SelectedImage,
  UnsplashPhoto,
} from '@/lib/types/image-selection';

export const MAX_IMAGE_FILE_SIZE_MB = 10;
export const MAX_IMAGE_FILE_SIZE = MAX_IMAGE_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export function validateImageFile(file: File): ImageValidationResult {
  if (file.size === 0) {
    return { isValid: false, error: { code: 'EMPTY_FILE' } };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return { isValid: false, error: { code: 'FILE_TOO_LARGE' } };
  }

  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    )
  ) {
    return { isValid: false, error: { code: 'INVALID_FILE_TYPE' } };
  }

  return { isValid: true };
}

export function createUploadedSelectedImage(file: File): SelectedImage {
  const objectUrl = URL.createObjectURL(file);

  return {
    url: objectUrl,
    thumbnailUrl: objectUrl,
    originalUrl: objectUrl,
    source: 'upload',
    uploadStatus: 'completed',
    file,
  };
}

export function createUnsplashSelectedImage(
  photo: UnsplashPhoto
): SelectedImage {
  return {
    url: photo.urls.regular,
    thumbnailUrl: photo.urls.small,
    originalUrl: photo.urls.full || photo.urls.regular,
    attribution: {
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      unsplashUrl: photo.links.html,
    },
    source: 'unsplash',
    uploadStatus: 'completed',
    downloadLocation: photo.links.downloadLocation,
  };
}

export function pickRandomPhoto(photos: UnsplashPhoto[]): UnsplashPhoto | null {
  if (photos.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * photos.length);
  return photos[randomIndex] ?? null;
}

export function revokeSelectedImageObjectUrl(
  image: SelectedImage | null | undefined
): void {
  if (!image || image.source !== 'upload') {
    return;
  }

  if (image.url.startsWith('blob:')) {
    URL.revokeObjectURL(image.url);
  }
}

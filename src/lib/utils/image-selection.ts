import type {
  ImageValidationResult,
  SelectedImage,
} from '@/lib/types/image-selection';

import type { UnsplashPhoto } from '@/lib/api/unsplash-service';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return {
      isValid: false,
      error: { code: 'INVALID_FILE_TYPE', message: 'No file provided' },
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: { code: 'INVALID_FILE_TYPE', message: 'File is empty' },
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File size must be less than ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
      },
    };
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'File must be a valid image (JPEG, PNG, WebP, or GIF)',
      },
    };
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
    originalUrl: photo.urls.full,
    attribution: {
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      unsplashUrl: photo.links.html,
    },
    source: 'unsplash',
    uploadStatus: 'completed',
    downloadLocation: photo.links.download_location,
  };
}

export function pickRandomPhoto(photos: UnsplashPhoto[]): UnsplashPhoto | null {
  if (!photos.length) {
    return null;
  }
  return photos[Math.floor(Math.random() * photos.length)] ?? null;
}

export function revokeSelectedImageObjectUrl(image: SelectedImage | null) {
  if (!image) {
    return;
  }

  if (image.source !== 'upload') {
    return;
  }

  if (!image.url.startsWith('blob:')) {
    return;
  }

  try {
    URL.revokeObjectURL(image.url);
  } catch {
    // ignore
  }
}

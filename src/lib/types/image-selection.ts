export type SelectedImageSource = 'unsplash' | 'upload';

export type ImageUploadStatus =
  | 'pending'
  | 'uploading'
  | 'completed'
  | 'failed';

export interface UnsplashAttribution {
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
}

export interface SelectedImage {
  url: string;
  thumbnailUrl: string;
  originalUrl?: string;
  attribution?: UnsplashAttribution;
  source: SelectedImageSource;
  uploadStatus: ImageUploadStatus;
  downloadLocation?: string;
  file?: File;
}

export interface ImageUploadError {
  code:
    | 'FILE_TOO_LARGE'
    | 'INVALID_FILE_TYPE'
    | 'UPLOAD_FAILED'
    | 'NETWORK_ERROR';
  message: string;
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: ImageUploadError;
}

export interface ImageCategory {
  id: string;
  query: string;
}

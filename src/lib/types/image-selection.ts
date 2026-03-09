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

export type ImageUploadErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'EMPTY_FILE';

export interface ImageUploadError {
  code: ImageUploadErrorCode;
  message: string;
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: ImageUploadError;
}

export interface SeasonalWindow {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface ImageCategory {
  id: string;
  query: string;
  seasonal?: SeasonalWindow;
}

export interface UnsplashPhoto {
  id: string;
  altDescription: string | null;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
    downloadLocation: string;
  };
}

export interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  totalPages: number;
}

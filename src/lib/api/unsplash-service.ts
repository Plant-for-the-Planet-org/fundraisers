import { createApi } from 'unsplash-js';

import { getImageCategoriesFallback } from '@/lib/constants/image-categories';
import type {
  UnsplashPhoto,
  UnsplashSearchResponse,
} from '@/lib/types/image-selection';

const DEFAULT_FALLBACK_QUERY = 'fundraising community charity helping';

export class UnsplashServiceError extends Error {
  status?: number;

  code: string;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'UnsplashServiceError';
    this.code = code;
    this.status = status;
  }
}

function normalizePhoto(rawPhoto: unknown): UnsplashPhoto {
  const photo = (rawPhoto ?? {}) as Record<string, unknown>;
  const rawUrls = (photo.urls ?? {}) as Record<string, unknown>;
  const rawUser = (photo.user ?? {}) as Record<string, unknown>;
  const rawUserLinks = (rawUser.links ?? {}) as Record<string, unknown>;
  const rawLinks = (photo.links ?? {}) as Record<string, unknown>;

  const thumb = String(
    rawUrls.thumb ?? rawUrls.small ?? rawUrls.regular ?? rawUrls.full ?? ''
  );
  const small = String(
    rawUrls.small ?? rawUrls.thumb ?? rawUrls.regular ?? rawUrls.full ?? ''
  );
  const regular = String(
    rawUrls.regular ?? rawUrls.small ?? rawUrls.thumb ?? rawUrls.full ?? ''
  );
  const full = String(
    rawUrls.full ?? rawUrls.regular ?? rawUrls.small ?? rawUrls.thumb ?? ''
  );

  return {
    id: String(photo.id ?? ''),
    altDescription:
      typeof photo.alt_description === 'string' ? photo.alt_description : null,
    urls: {
      thumb,
      small,
      regular,
      full,
    },
    user: {
      name: String(rawUser.name ?? 'Unknown'),
      links: {
        html: String(rawUserLinks.html ?? ''),
      },
    },
    links: {
      html: String(rawLinks.html ?? ''),
      downloadLocation: String(rawLinks.download_location ?? ''),
    },
  };
}

function ensurePhotoList(result: unknown): unknown[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (!result) {
    return [];
  }

  return [result];
}

interface UnsplashApiSuccess<T> {
  type: 'success';
  response: T;
}

interface UnsplashApiError {
  type: 'error';
  status?: number;
  errors?: string[];
}

type UnsplashApiResponse<T> = UnsplashApiSuccess<T> | UnsplashApiError;

export class UnsplashService {
  private readonly accessKey: string;

  private readonly unsplash: ReturnType<typeof createApi> | null;

  constructor() {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY ?? '';
    this.unsplash = this.accessKey
      ? createApi({
          accessKey: this.accessKey,
        })
      : null;
  }

  isAvailable(): boolean {
    return Boolean(this.unsplash);
  }

  private getClient(): ReturnType<typeof createApi> {
    if (!this.unsplash) {
      throw new UnsplashServiceError(
        'Unsplash service is not configured.',
        'API_KEY_MISSING',
        503
      );
    }

    return this.unsplash;
  }

  private unwrapResponse<T>(response: UnsplashApiResponse<T>): T {
    if (response.type === 'error') {
      const status = response.status;
      const firstError = response.errors?.[0];

      if (status === 401) {
        throw new UnsplashServiceError(
          firstError ?? 'Unsplash authentication failed.',
          'AUTH_ERROR',
          401
        );
      }

      if (status === 403) {
        throw new UnsplashServiceError(
          firstError ?? 'Unsplash rate limit exceeded.',
          'RATE_LIMIT_EXCEEDED',
          403
        );
      }

      throw new UnsplashServiceError(
        firstError ?? 'Unsplash request failed.',
        'REQUEST_FAILED',
        status
      );
    }

    return response.response;
  }

  private resolveCategoryQuery(categoryId: string): string {
    const category = getImageCategoriesFallback().find(
      item => item.id === categoryId
    );
    return category?.query ?? DEFAULT_FALLBACK_QUERY;
  }

  async searchPhotos(
    query: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<UnsplashSearchResponse> {
    const client = this.getClient();
    const response = (await client.search.getPhotos({
      query,
      page,
      perPage,
      orientation: 'landscape',
    })) as UnsplashApiResponse<{
      results: unknown[];
      total: number;
      total_pages: number;
    }>;

    const result = this.unwrapResponse(response);
    const results = (result.results ?? []).map(normalizePhoto);

    return {
      results,
      total: Number(result.total ?? results.length),
      totalPages: Number(result.total_pages ?? 1),
    };
  }

  async getCategoryImages(
    categoryId: string,
    count: number = 20
  ): Promise<UnsplashPhoto[]> {
    const client = this.getClient();
    const query = this.resolveCategoryQuery(categoryId);

    const response = (await client.photos.getRandom({
      query,
      count,
      orientation: 'landscape',
    })) as UnsplashApiResponse<unknown[] | unknown>;

    const result = this.unwrapResponse(response);
    const photos = ensurePhotoList(result).map(normalizePhoto);

    return photos.filter(
      photo => photo.id && photo.urls.small && photo.urls.regular
    );
  }

  async trackDownload(downloadLocation: string): Promise<void> {
    const client = this.getClient();

    const response = (await client.photos.trackDownload({
      downloadLocation,
    })) as UnsplashApiResponse<unknown>;

    this.unwrapResponse(response);
  }
}

export const unsplashService = new UnsplashService();

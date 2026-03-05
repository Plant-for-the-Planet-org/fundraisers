/**
 * Unsplash API Service
 * Server-side integration using the official Unsplash SDK.
 */

import { createApi } from 'unsplash-js';
import type { Basic } from 'unsplash-js/dist/methods/photos/types';
import type { ApiResponse } from 'unsplash-js/dist/helpers/response';

import { getStaticImageCategories } from '@/lib/constants/image-categories';

export class UnsplashAPIError extends Error {
  constructor(
    message: string,
    public code:
      | 'API_KEY_MISSING'
      | 'AUTH_ERROR'
      | 'RATE_LIMIT_EXCEEDED'
      | 'HTTP_ERROR'
      | 'NO_PHOTOS_FOUND',
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'UnsplashAPIError';
  }
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
    download_location: string;
  };
}

export interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
  totalPages: number;
}

function normalizePhoto(photo: Basic): UnsplashPhoto {
  return {
    id: photo.id,
    altDescription: photo.alt_description ?? null,
    urls: {
      thumb: photo.urls.thumb,
      small: photo.urls.small,
      regular: photo.urls.regular,
      full: photo.urls.full,
    },
    user: {
      name: photo.user.name,
      links: {
        html: photo.user.links.html,
      },
    },
    links: {
      html: photo.links.html,
      download_location: photo.links.download_location,
    },
  };
}

export class UnsplashService {
  private unsplash: ReturnType<typeof createApi> | null = null;
  private accessKey: string;

  constructor() {
    this.accessKey = process.env.UNSPLASH_ACCESS_KEY || '';
    if (this.accessKey) {
      this.unsplash = createApi({ accessKey: this.accessKey });
    }
  }

  private handleApiResponse<T>(response: ApiResponse<T>): T {
    if (response.type === 'error') {
      const status = response.status;
      const errorMessage = response.errors?.[0] || 'Unknown error';

      if (status === 403) {
        throw new UnsplashAPIError(
          'Unsplash API rate limit exceeded',
          'RATE_LIMIT_EXCEEDED',
          403,
          response.errors
        );
      }

      if (status === 401) {
        throw new UnsplashAPIError(
          'Unsplash API authentication failed',
          'AUTH_ERROR',
          401,
          response.errors
        );
      }

      throw new UnsplashAPIError(
        errorMessage,
        'HTTP_ERROR',
        status,
        response.errors
      );
    }

    return response.response;
  }

  isAvailable(): boolean {
    return Boolean(this.accessKey);
  }

  async searchPhotos(
    query: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<UnsplashSearchResponse> {
    if (!this.unsplash) {
      throw new UnsplashAPIError(
        'Unsplash API key not configured',
        'API_KEY_MISSING',
        500
      );
    }

    const response = await this.unsplash.search.getPhotos({
      query,
      page,
      perPage,
      orientation: 'landscape',
    });

    const result = this.handleApiResponse(response);

    return {
      results: result.results.map(normalizePhoto),
      total: result.total,
      totalPages: result.total_pages,
    };
  }

  private async getRandomPhotos(
    count: number,
    query: string
  ): Promise<UnsplashPhoto[]> {
    if (!this.unsplash) {
      throw new UnsplashAPIError(
        'Unsplash API key not configured',
        'API_KEY_MISSING',
        500
      );
    }

    const response = await this.unsplash.photos.getRandom({
      query,
      count,
      orientation: 'landscape',
    });

    const result = this.handleApiResponse(response);

    if (Array.isArray(result)) {
      return result.map(photo => normalizePhoto(photo as Basic));
    }

    if (!result) {
      return [];
    }

    return [normalizePhoto(result as Basic)];
  }

  async getCategoryImages(
    categoryId: string,
    count: number = 20
  ): Promise<UnsplashPhoto[]> {
    const categories = getStaticImageCategories();
    const category = categories.find(cat => cat.id === categoryId);
    const query = category?.query || 'fundraising community charity helping';
    return this.getRandomPhotos(count, query);
  }

  async trackDownload(downloadLocation: string): Promise<void> {
    if (!this.unsplash) {
      return;
    }

    try {
      await this.unsplash.photos.trackDownload({ downloadLocation });
    } catch {
      // Optional compliance tracking — don't block UI flows.
    }
  }
}

export const unsplashService = new UnsplashService();

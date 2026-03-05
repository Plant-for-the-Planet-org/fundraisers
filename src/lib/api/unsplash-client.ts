/**
 * Client-side Unsplash API wrapper.
 * Calls our proxy route instead of hitting Unsplash directly.
 */

import type { UnsplashPhoto, UnsplashSearchResponse } from './unsplash-service';

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof (payload as ApiErrorResponse).error?.message === 'string'
  ) {
    return (payload as ApiErrorResponse).error!.message!;
  }
  return fallback;
}

export class UnsplashClient {
  private baseUrl = '/api/images/unsplash';

  async searchPhotos(
    query: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<UnsplashSearchResponse> {
    const params = new URLSearchParams({
      action: 'search',
      query,
      page: String(page),
      count: String(perPage),
    });

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as unknown;
      throw new Error(getErrorMessage(payload, 'Failed to search images'));
    }

    return response.json();
  }

  async getCategoryImages(
    categoryId: string,
    count: number = 20
  ): Promise<UnsplashPhoto[]> {
    const params = new URLSearchParams({
      action: 'category',
      category: categoryId,
      count: String(count),
    });

    const response = await fetch(`${this.baseUrl}?${params.toString()}`);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as unknown;
      throw new Error(
        getErrorMessage(payload, 'Failed to load category images')
      );
    }

    const data = (await response.json()) as { results: UnsplashPhoto[] };
    return data.results;
  }

  async trackDownload(downloadLocation: string): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ downloadLocation }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as unknown;
      throw new Error(getErrorMessage(payload, 'Failed to track download'));
    }
  }

  isAvailable(): boolean {
    return true;
  }
}

export const unsplashClient = new UnsplashClient();

import type {
  UnsplashPhoto,
  UnsplashSearchResponse,
} from '@/lib/types/image-selection';

const UNSPLASH_API_BASE_URL = '/api/images/unsplash';

interface UnsplashCategoryResponse {
  results: UnsplashPhoto[];
}

interface ApiErrorResponse {
  error?: string;
}

async function parseApiError(
  response: Response,
  fallback: string
): Promise<Error> {
  try {
    const payload = (await response.json()) as ApiErrorResponse;
    return new Error(payload.error ?? fallback);
  } catch {
    return new Error(fallback);
  }
}

export class UnsplashClientService {
  async searchPhotos(
    query: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<UnsplashSearchResponse> {
    const params = new URLSearchParams({
      action: 'search',
      query,
      page: page.toString(),
      count: perPage.toString(),
    });

    const response = await fetch(
      `${UNSPLASH_API_BASE_URL}?${params.toString()}`
    );

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to search images.');
    }

    const payload = (await response.json()) as UnsplashSearchResponse;
    return payload;
  }

  async getCategoryImages(
    categoryId: string,
    count: number = 20
  ): Promise<UnsplashPhoto[]> {
    const params = new URLSearchParams({
      action: 'category',
      category: categoryId,
      count: count.toString(),
    });

    const response = await fetch(
      `${UNSPLASH_API_BASE_URL}?${params.toString()}`
    );

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to load images.');
    }

    const payload = (await response.json()) as UnsplashCategoryResponse;
    return payload.results;
  }

  async trackDownload(downloadLocation: string): Promise<void> {
    const response = await fetch(UNSPLASH_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ downloadLocation }),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Failed to track image download.');
    }
  }
}

export const unsplashClient = new UnsplashClientService();

/**
 * Categories API Service
 * Handles category-related API calls
 */

import type { Category } from '@/lib/types/category';
import type { Fundraiser } from '@/lib/types/fundraiser';
import { API_BASE_URL } from '@/lib/constants/app-config';

export interface ApiFundraiser extends Omit<Fundraiser, 'workspace'> {
  workspace: Fundraiser['workspace'] | [];
}

interface RawCategoryFundraisersResponse {
  category: Category;
  fundraisers: ApiFundraiser[];
}

export interface CategoryFundraisersResponse {
  category: Category;
  fundraisers: Fundraiser[];
}

export type FundraiserSortOptions = 'popular' | 'recent' | 'gross';

export interface CategoryOptions {
  sort_by?: FundraiserSortOptions;
}

function normalizeFundraiser(fundraiser: ApiFundraiser): Fundraiser {
  return {
    ...fundraiser,
    workspace: Array.isArray(fundraiser.workspace)
      ? null
      : fundraiser.workspace,
  };
}

function normalizeFundraisersResponse(
  response: RawCategoryFundraisersResponse
): CategoryFundraisersResponse {
  return {
    ...response,
    fundraisers: response.fundraisers.map(normalizeFundraiser),
  };
}

export class CategoriesService {
  /**
   * Get categories by type
   * Note: This endpoint does not require authentication
   */
  async getCategories(type?: 'cause' | 'location'): Promise<Category[]> {
    const params = new URLSearchParams();
    if (type) {
      params.append('type', type);
    }

    const url = `${API_BASE_URL}/fundraiser/categories${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get categories with retry logic
   */
  async getCategoriesWithRetry(
    type?: 'cause' | 'location',
    maxRetries: number = 2
  ): Promise<Category[]> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.getCategories(type);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    throw lastError!;
  }

  /**
   * Get fundraisers for a specific category
   * Note: This endpoint does not require authentication
   */
  async getCategoryFundraisers(
    slug: string,
    options?: CategoryOptions
  ): Promise<CategoryFundraisersResponse> {
    const params = new URLSearchParams();
    if (options?.sort_by) {
      params.append('sort_by', options.sort_by);
    }

    const url = `${API_BASE_URL}/fundraiser/categories/${slug}${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch category fundraisers: ${response.statusText}`
      );
    }

    const data: RawCategoryFundraisersResponse = await response.json();
    return normalizeFundraisersResponse(data);
  }

  /**
   * Get category fundraisers with retry logic
   */
  async getCategoryFundraisersWithRetry(
    slug: string,
    options?: CategoryOptions,
    maxRetries: number = 2
  ): Promise<CategoryFundraisersResponse> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.getCategoryFundraisers(slug, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    throw lastError!;
  }
}

// Create a singleton instance
export const categoriesService = new CategoriesService();

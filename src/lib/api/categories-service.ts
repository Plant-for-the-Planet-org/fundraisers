/**
 * Categories API Service
 * Handles category-related API calls
 */

import type { Category } from '@/lib/types/category';
export interface CategoryFundraisersResponse {
  category: Category;
  fundraisers: any[];
}

export interface CategoryOptions {
  sort_by?: 'popular' | 'recent' | 'gross';
}

import { API_BASE_URL } from '@/lib/constants/app-config';

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

    return response.json();
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

// Export types for use in components
// export type { Category as CategoryResponse };

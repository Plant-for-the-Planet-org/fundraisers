/**
 * Categories API Service
 * Handles category-related API calls
 */

import type { Category } from '@/lib/types/category';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { platformFetch } from '@/lib/api/platform-fetch';
import { withRetry } from '@/lib/api/utils';

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

const VALID_SORT_OPTIONS: FundraiserSortOptions[] = [
  'popular',
  'recent',
  'gross',
];

export function isFundraiserSortOption(
  value: unknown
): value is FundraiserSortOptions {
  return (
    typeof value === 'string' &&
    (VALID_SORT_OPTIONS as readonly string[]).includes(value)
  );
}

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
    const path = type
      ? `/fundraiser/categories?type=${encodeURIComponent(type)}`
      : `/fundraiser/categories`;
    return platformFetch<Category[]>(path);
  }

  /**
   * Get categories with retry logic
   */
  async getCategoriesWithRetry(
    type?: 'cause' | 'location',
    maxRetries: number = 2
  ): Promise<Category[]> {
    return withRetry(() => this.getCategories(type), maxRetries);
  }

  /**
   * Get fundraisers for a specific category
   * Note: This endpoint does not require authentication
   */
  async getCategoryFundraisers(
    slug: string,
    options?: CategoryOptions
  ): Promise<CategoryFundraisersResponse> {
    const path = options?.sort_by
      ? `/fundraiser/categories/${encodeURIComponent(slug)}?sort_by=${encodeURIComponent(options.sort_by)}`
      : `/fundraiser/categories/${encodeURIComponent(slug)}`;
    const data = await platformFetch<RawCategoryFundraisersResponse>(path);
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
    return withRetry(
      () => this.getCategoryFundraisers(slug, options),
      maxRetries
    );
  }
}

// Create a singleton instance
export const categoriesService = new CategoriesService();

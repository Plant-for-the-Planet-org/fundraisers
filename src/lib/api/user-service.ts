import { platformAPIClient, PlatformAPIError } from './external-client';

export interface Address {
  id: string;
  type: string;
  address: string;
  address2: string | null;
  city: string;
  zipCode: string;
  country: string;
  state: string | null;
  isPrimary: boolean;
  name: string;
}
export interface UserProfileResponse {
  slug: string;
  type: 'individual' | 'organization';
  currency: string;
  name: string | null;
  firstname: string;
  lastname: string;
  country: string;
  email: string;
  image: string | null;
  url: string | null;
  urlText: string | null;
  displayName: string;
  supportPin: string;
  created: string;
  supportedProfile: any | null;
  id: string;
  isPrivate: boolean;
  getNews: boolean;
  bio: string | null;
  addresses: Address[];
  address: {
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
  targets: {
    treesDonated: number;
    areaConserved: number;
    areaRestored: number;
  };
  locale: string;
  exposeCommunity: boolean;
  hasLogoLicense: boolean;
  tin: string | null;
  isMember: boolean;
  treemapperMigrationState: any | null;
  legacyPriceTill: string | null;
  planetCash: {
    account: string;
    country: string;
    currency: string;
    balance: number;
    creditLimit: number;
    giftFunds: any[];
  };
  scores: {
    treesDonated: {
      personal: number;
      received: number;
      target: number;
    };
    areaRestored: {
      personal: number;
      received: number;
      target: number;
    };
    areaConserved: {
      personal: number;
      received: number;
      target: number;
    };
    treesPlanted: number;
    fundsDonated: Record<string, number>;
  };
  score: {
    personal: number;
    received: number;
    target: number;
  };
}

export class UserService {
  /**
   * Get user profile
   * Replaces: /api/user/profile
   * Note: This endpoint requires authentication and will create user if doesn't exist
   */
  async getProfile(token: string): Promise<UserProfileResponse> {
    try {
      const endpoint = '/profile';
      return await platformAPIClient.getAuthenticated<UserProfileResponse>(
        endpoint,
        token
      );
    } catch (error) {
      if (error instanceof PlatformAPIError) {
        throw error;
      }
      throw new PlatformAPIError(
        error instanceof Error ? error.message : 'Failed to fetch user profile',
        'PROFILE_FETCH_ERROR',
        0
      );
    }
  }

  /**
   * Get profile and handle authentication errors gracefully
   * Returns null if authentication fails instead of throwing
   */
  async getProfileSafe(token: string): Promise<UserProfileResponse | null> {
    try {
      return await this.getProfile(token);
    } catch (error) {
      if (error instanceof PlatformAPIError && error.status === 401) {
        return null;
      }
      throw error;
    }
  }
}

// Create a singleton instance
export const userService = new UserService();

export type { UserProfileResponse as UserProfile };

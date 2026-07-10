import type { UserType } from '@planet-sdk/common';
import type { Nullable } from '../types/utility';

import { PlatformAPIError, platformFetch } from './platform-fetch';

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
  type: UserType;
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
  planetCash: Nullable<{
    account: string;
    country: string;
    currency: string;
    balance: number;
    creditLimit: number;
    giftFunds: any[];
  }>;
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

export type ProfilePaymentMethodType =
  | 'card'
  | 'sepa_debit'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'
  | 'bank_transfer';

export interface ProfilePaymentMethod {
  id: string;
  type: ProfilePaymentMethodType;
  brand?: string | null;
  expires?: string | null;
  last4: string;
  isDefault: boolean;
}

export class UserService {
  /**
   * Get user profile
   * Replaces: /api/user/profile
   * Note: This endpoint requires authentication and will create user if doesn't exist
   */
  async getProfile(token: string): Promise<UserProfileResponse> {
    return platformFetch<UserProfileResponse>('/profile', { token });
  }

  /**
   * Get the payment methods available to the authenticated user for a country.
   * GET /profile/paymentMethods/{country}
   *
   * Always resolves to an array — the platform returns one, but we normalize
   * defensively so callers never have to guard against a non-array body.
   */
  async getPaymentMethods(
    token: string,
    country: string
  ): Promise<ProfilePaymentMethod[]> {
    const methods = await platformFetch<ProfilePaymentMethod[]>(
      `/profile/paymentMethods/${country}`,
      { token }
    );
    return Array.isArray(methods) ? methods : [];
  }

  /**
   * Validate impersonation credentials by fetching /profile with the
   * impersonation headers. Returns the impersonated user's profile on success,
   * throws PlatformAPIError on failure (e.g. 401/403 from a bad pin or email).
   */
  async validateImpersonation(
    token: string,
    email: string,
    pin: string
  ): Promise<UserProfileResponse> {
    return platformFetch<UserProfileResponse>('/profile', {
      token,
      skipImpersonationFromStore: true,
      extraHeaders: {
        'x-switch-user': email,
        'x-user-support-pin': pin,
      },
    });
  }

  /**
   * Get profile and handle authentication errors gracefully
   * Returns null if authentication fails instead of throwing
   */
  async getProfileSafe(token: string): Promise<UserProfileResponse | null> {
    try {
      return await this.getProfile(token);
    } catch (error) {
      if (
        error instanceof PlatformAPIError &&
        (error.status === 401 || error.status === 403)
      ) {
        return null;
      }
      throw error;
    }
  }
}

// Create a singleton instance
export const userService = new UserService();

export type { UserProfileResponse as UserProfile };

import type { UserType } from '@planet-sdk/common';
import type { Auth0TokenClaims } from '../types/auth';
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
  // Nullable on the platform: org and tpo profiles carry `name` and leave firstname/lastname null.
  currency: string | null;
  name: string | null;
  firstname: string | null;
  lastname: string | null;
  country: string | null;
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

/**
 * Outcome of a profile lookup.
 * `needs-signup` is the platform's 303: the token is valid but no profile exists for its email.
 */
export type ProfileLookupResult =
  | { status: 'ok'; profile: UserProfileResponse }
  | { status: 'needs-signup'; tokenClaims: Auth0TokenClaims }
  | { status: 'unauthorized' };

/** Pull the token claims out of a 303 body, tolerating a shape we did not expect. */
function readTokenClaims(body: unknown): Auth0TokenClaims {
  if (body && typeof body === 'object' && 'userInfo' in body) {
    const { userInfo } = body as { userInfo: unknown };
    if (userInfo && typeof userInfo === 'object')
      return userInfo as Auth0TokenClaims;
  }
  return {};
}

/**
 * Body for `POST /profile`.
 *
 * Not `CreateUserRequest` from @planet-sdk/common: that type has no `locale`, and its `CountryCode` union is stale (no SS, CW, SX or BQ, still carrying retired AN and TP), so it would reject codes the platform accepts.
 * The platform rejects any field it does not know with a 400, so keep this to fields the registration form maps.
 */
export interface CreateProfileRequest {
  type: 'individual';
  firstname: string;
  lastname: string;
  country: string;
  locale: string;
  isPrivate: boolean;
  getNews: boolean;
  oAuthAccessToken: string;
}

export class UserService {
  /**
   * Get user profile.
   * Requires authentication. It never creates the profile: the platform answers 303 when the user has not signed up.
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
   * Create the profile for an already-authenticated Auth0 user.
   *
   * Deliberately unauthenticated: the platform's firewall runs whenever an Authorization header is present, which answers 303 before this endpoint is reached. The token goes in the body as `oAuthAccessToken`, where the platform verifies it against Auth0.
   */
  async createProfile(
    payload: CreateProfileRequest
  ): Promise<UserProfileResponse> {
    return platformFetch<UserProfileResponse>('/profile', {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * Get the profile, separating the two expected non-success outcomes from real failures.
   * Anything else still throws.
   */
  async getProfileSafe(token: string): Promise<ProfileLookupResult> {
    try {
      return { status: 'ok', profile: await this.getProfile(token) };
    } catch (error) {
      if (!(error instanceof PlatformAPIError)) throw error;

      // The platform signals "authenticated, but no profile yet" with a 303 carrying the access token claims. There is no Location header, so fetch surfaces it as a status rather than following it.
      if (error.status === 303) {
        return {
          status: 'needs-signup',
          tokenClaims: readTokenClaims(error.body),
        };
      }

      // A 403 here is an authorization denial (a denied impersonation switch, e.g. a stale support pin), not an invalid session, so let it throw rather than clear the impersonator's own auth.
      if (error.status === 401) {
        return { status: 'unauthorized' };
      }

      throw error;
    }
  }
}

// Create a singleton instance
export const userService = new UserService();

export type { UserProfileResponse as UserProfile };

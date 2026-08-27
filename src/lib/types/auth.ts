export const ALLOWED_REDIRECT_ROOTS = [
  '/explore',
  '/dashboard',
  '/fundraisers',
  '/raise',
] as const;

type AllowedRoot = (typeof ALLOWED_REDIRECT_ROOTS)[number];

export type RedirectPath = AllowedRoot | `${AllowedRoot}/${string}`;

/**
 * Auth0 access token claims, as the platform returns them in the 303 body when the user has no profile yet.
 * An Auth0 action adds the namespaced email claims; the standard ones are the fallback.
 * There are no name claims on an access token. Those come from Auth0's /userinfo.
 */
export interface Auth0TokenClaims {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  'https://app.plant-for-the-planet.org/email'?: string;
  'https://app.plant-for-the-planet.org/email_verified'?: boolean;
}

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
  // Auth0 sends this as a boolean or the string 'true' depending on the connection, and the platform parses both. See https://community.auth0.com/t/userinfo-email-verified-field-string-boolean-or-both/27553
  email_verified?: boolean | string;
  'https://app.plant-for-the-planet.org/email'?: string;
  'https://app.plant-for-the-planet.org/email_verified'?: boolean | string;
}

/** Auth0 /userinfo response. This is where the name claims live; an access token has none. */
export interface Auth0UserInfo {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean | string;
}

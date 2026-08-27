import type { UserProfile } from '../api/user-service';
import type { Auth0TokenClaims } from '../types/auth';

import { userService } from '../api/user-service';
import { deriveIdentity } from './auth0-identity';
import { fetchUserInfo } from './auth0-userinfo';
import { resolveSignupCountry } from './signup-country';

/** Why a profile could not be created. Only `create-failed` is worth retrying; the other two need the user to do something first. */
export type SignupFailureReason =
  | 'unverified-email'
  | 'no-email'
  | 'create-failed';

/** Enough to keep a session usable without a profile: who the user is, as far as Auth0 told us. */
export interface PartialIdentity {
  sub: string | null;
  email: string | null;
  name: string | null;
}

export type EnsureProfileResult =
  | { status: 'ready'; profile: UserProfile }
  | { status: 'unauthorized' }
  | {
      status: 'failed';
      reason: SignupFailureReason;
      identity: PartialIdentity;
    };

export function isRetryable(reason: SignupFailureReason): boolean {
  return reason === 'create-failed';
}

/**
 * Get the signed-in user's profile, creating it first if they have not signed up.
 *
 * Fundraisers has no signup form. Everything the platform requires is derived from the Auth0 token, /userinfo and the caller's IP, so a first sign-in and a return visit look the same to the user.
 */
export async function ensureProfile(
  accessToken: string,
  locale: string
): Promise<EnsureProfileResult> {
  const lookup = await userService.getProfileSafe(accessToken);

  if (lookup.status === 'ok')
    return { status: 'ready', profile: lookup.profile };
  if (lookup.status === 'unauthorized') return { status: 'unauthorized' };

  return createProfileOnce(accessToken, locale, lookup.tokenClaims);
}

// The platform has no idempotency on this endpoint: a second POST for the same email hits a unique index and fails as a server error, not a clean conflict. Sharing one in-flight promise keeps a remount or an overlapping retry down to a single request.
let inFlight: Promise<EnsureProfileResult> | null = null;

function createProfileOnce(
  accessToken: string,
  locale: string,
  tokenClaims: Auth0TokenClaims
): Promise<EnsureProfileResult> {
  if (!inFlight) {
    inFlight = createProfile(accessToken, locale, tokenClaims).finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}

async function createProfile(
  accessToken: string,
  locale: string,
  tokenClaims: Auth0TokenClaims
): Promise<EnsureProfileResult> {
  const userInfo = await fetchUserInfo(accessToken);
  const identity = deriveIdentity(tokenClaims, userInfo);
  const partial: PartialIdentity = {
    sub: tokenClaims.sub ?? null,
    email: identity.email,
    name: userInfo?.name?.trim() || identity.email,
  };

  // The platform takes the email from the token itself and refuses a token without one, so there is nothing to send.
  if (!identity.email) {
    return { status: 'failed', reason: 'no-email', identity: partial };
  }

  // The platform silently forces a profile private when the email is unverified, and the Auth0 callback already turns these users away. Creating one here would only make a profile the user cannot see the point of.
  if (!identity.emailVerified) {
    return { status: 'failed', reason: 'unverified-email', identity: partial };
  }

  try {
    const profile = await userService.createProfile({
      type: 'individual',
      firstname: identity.firstname,
      lastname: identity.lastname,
      country: await resolveSignupCountry(locale),
      locale,
      // No signup form means no consent was given, so opt into nothing.
      isPrivate: true,
      getNews: false,
      oAuthAccessToken: accessToken,
    });

    return { status: 'ready', profile };
  } catch (error) {
    console.error('Implicit signup failed:', error);
    return { status: 'failed', reason: 'create-failed', identity: partial };
  }
}

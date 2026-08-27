import type { Auth0TokenClaims, Auth0UserInfo } from '../types/auth';

const PLANET_EMAIL_CLAIM = 'https://app.plant-for-the-planet.org/email';
const PLANET_EMAIL_VERIFIED_CLAIM =
  'https://app.plant-for-the-planet.org/email_verified';

// The platform validates these on registration, and they differ: a dot is fine in a first name but not in a last name.
const FIRSTNAME_ALLOWED = /[^\p{L}\p{N}\sß.'-]/gu;
const LASTNAME_ALLOWED = /[^\p{L}\p{N}\sß'-]/gu;

/** Stands in for a last name we could not derive. The platform requires a non-blank value and its regex allows a hyphen. */
export const LASTNAME_PLACEHOLDER = '-';

export interface Auth0Identity {
  email: string | null;
  emailVerified: boolean;
  firstname: string;
  lastname: string;
}

/**
 * Work out who signed up, from the two sources we have.
 *
 * Email comes from the access token claims, reading the namespaced claim first, the same order the platform itself uses.
 * The name comes from /userinfo when Auth0 knows one, and from the email address when it does not.
 */
export function deriveIdentity(
  tokenClaims: Auth0TokenClaims,
  userInfo: Auth0UserInfo | null
): Auth0Identity {
  const email = readEmail(tokenClaims, userInfo);
  const { firstname, lastname } = readName(userInfo, email);

  return {
    email,
    emailVerified: readEmailVerified(tokenClaims),
    firstname: sanitize(firstname, FIRSTNAME_ALLOWED),
    lastname: sanitize(lastname, LASTNAME_ALLOWED) || LASTNAME_PLACEHOLDER,
  };
}

function readEmail(
  tokenClaims: Auth0TokenClaims,
  userInfo: Auth0UserInfo | null
): string | null {
  const email =
    tokenClaims[PLANET_EMAIL_CLAIM] ?? tokenClaims.email ?? userInfo?.email;
  return email?.trim() || null;
}

// Auth0 sends this as a boolean or the string 'true' depending on the connection.
function readEmailVerified(tokenClaims: Auth0TokenClaims): boolean {
  const verified =
    tokenClaims[PLANET_EMAIL_VERIFIED_CLAIM] ?? tokenClaims.email_verified;
  return verified === true || verified === 'true';
}

function readName(userInfo: Auth0UserInfo | null, email: string | null) {
  const given = userInfo?.given_name?.trim() ?? '';
  const family = userInfo?.family_name?.trim() ?? '';
  if (given) return { firstname: given, lastname: family };

  // Email and password signups usually have no name claims at all, and Auth0 fills `name` with the email address. That is not a name.
  const full = userInfo?.name?.trim() ?? '';
  if (full && !full.includes('@')) {
    const [first, ...rest] = full.split(/\s+/);
    return { firstname: first, lastname: rest.join(' ') };
  }

  return nameFromEmail(email);
}

function nameFromEmail(email: string | null) {
  const localPart = email?.split('@')[0] ?? '';
  const parts = localPart.split(/[._+-]+/).filter(Boolean);

  // Drop digit-only parts, which are noise rather than a name. Keep them if that leaves nothing, since a blank first name is rejected.
  const words = parts.filter(part => !/^\d+$/.test(part));
  const usable = words.length ? words : parts;

  const [first, ...rest] = usable.map(toTitleCase);
  return { firstname: first ?? '', lastname: rest.join(' ') };
}

function toTitleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function sanitize(value: string, disallowed: RegExp): string {
  return value.replace(disallowed, '').replace(/\s+/g, ' ').trim();
}

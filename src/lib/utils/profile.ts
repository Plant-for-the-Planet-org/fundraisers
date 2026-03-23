import type { Address, UserProfile } from '../api/user-service';

/**
 * Returns the best possible display name for a user.
 *
 * Priority order:
 * 1. displayName (if explicitly provided)
 * 2. firstname + lastname (if both exist)
 * 3. name
 * 4. email
 * 5. fallback to 'User'
 */

export const getDisplayName = (profile: UserProfile): string => {
  if (profile.displayName) return profile.displayName;

  if (profile.firstname && profile.lastname) {
    return `${profile.firstname} ${profile.lastname}`;
  }

  return profile.name || profile.email || 'User';
};

/**
 * Get primary address from profile
 */
export const getPrimaryAddress = (addresses: Address[]) =>
  addresses?.find(addr => addr.isPrimary) || addresses?.[0];

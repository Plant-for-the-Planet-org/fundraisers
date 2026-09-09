import type { FundraiserHostRole } from './fundraiser';
import type { Nullable } from './utility';

/** Where an invitation stands. `expired` covers a deadline that has passed, whether or not the platform's daily sweep has written that status yet. */
export type HostInviteState = 'pending' | 'accepted' | 'declined' | 'expired';

/**
 * One co-host invitation, as the platform serves it to whoever holds the link.
 *
 * Deliberately not a `FundraiserHost`: the caller is usually not signed in, so this carries only what an invitee may know about their own invitation. `invitedEmail` arrives masked (`m***@example.org`) — render it as given, never try to reconstruct it.
 *
 * The fundraiser is named, not described. Fetch the public fundraiser by `slug` when the page needs its cover or goal.
 */
export interface HostInvite {
  state: HostInviteState;
  role: FundraiserHostRole;
  isPublic: boolean;
  invitedEmail: Nullable<string>;
  /** Whether the invited address already has a Planet account. Decides whether accepting ends at the dashboard or at sign-up. */
  hasAccount: boolean;
  inviterName: Nullable<string>;
  expiresAt: Nullable<string>;
  answeredAt: Nullable<string>;
  fundraiser: {
    id: Nullable<string>;
    title: Nullable<string>;
    slug: Nullable<string>;
  };
}

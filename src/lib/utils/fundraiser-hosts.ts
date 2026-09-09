import type { FundraiserHost } from '@/lib/types/fundraiser';

/**
 * The hosts a public fundraiser page may name under "Hosted by".
 *
 * Co-hosting is opt-in, so only a host who accepted the invitation ('active') can appear. Someone still invited, or who declined or let the invite expire, never shows up, even with `isPublic` set.
 * `isPublic` narrows that further: it is the host's own choice to be named. When no active host chose to be public we fall back to the other active hosts, so the section is not empty on older fundraisers where nobody set the flag.
 */
export function selectPublicHosts(hosts: FundraiserHost[]): FundraiserHost[] {
  const activeHosts = hosts.filter(host => host.status === 'active');
  const publicHosts = activeHosts.filter(host => host.isPublic);

  return publicHosts.length > 0 ? publicHosts : activeHosts;
}

/**
 * Domains Plant-for-the-Planet actually owns/operates/trusts Links to these (and
 * any of their subdomains) skip the `/external` warning gate and open
 * directly. Everything else — including `mailto:`/`tel:`, which have no
 * domain to check — routes through `/external`.
 */
export const TRUSTED_DOMAINS = [
  'plant-for-the-planet.org',
  'thegoodshop.org',
  'salesforce.com',
  'startplanting.org',
  'pp.eco',
  // Government domains a fundraiser may legitimately cite. Entries are bare
  // hostname suffixes, so this covers `gov.np` and every `*.gov.np`.
  'gov.np',
] as const;

export function isWhitelistedHostname(hostname: string): boolean {
  return TRUSTED_DOMAINS.some(
    domain => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

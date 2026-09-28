import type { ForestCloudApp } from './catalogue';

/**
 * Apps visible to the current user.
 *
 * v0: no per-app grants exist in the Auth0 token yet, so callers pass no
 * `grants` and every ungated app shows. Apps that declare `requires` stay
 * hidden until grants arrive — fail closed, so internal tools never leak to
 * every signed-in user. The moment an Auth0 Action stamps an app-grant claim,
 * pass it here (see readGrants) and gated apps light up for entitled users with
 * no other code change.
 */
export function visibleApps(
  apps: ForestCloudApp[],
  grants?: string[]
): ForestCloudApp[] {
  return apps.filter(app => {
    if (app.hidden) return false;
    if (!app.requires || app.requires.length === 0) return true;
    if (!grants) return false;
    return app.requires.some(r => grants.includes(r));
  });
}

/** Namespaced claim that would carry the user's app grants, once it exists. */
const GRANTS_CLAIM = 'https://app.plant-for-the-planet.org/apps';

/**
 * Pull app-access grants from decoded token claims. Returns undefined when no
 * grant claim is present (the case today), which makes visibleApps fall back to
 * "show every ungated app". Wire this up once the tenant stamps the claim.
 */
export function readGrants(
  claims: Record<string, unknown> | null | undefined
): string[] | undefined {
  const raw = claims?.[GRANTS_CLAIM];
  return Array.isArray(raw) ? (raw as string[]) : undefined;
}

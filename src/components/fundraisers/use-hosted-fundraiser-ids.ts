'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useHostedFundraisersStore } from '@/stores/hosted-fundraisers-store';
import { useImpersonationStore } from '@/stores/impersonation-store';

/**
 * Returns the set of fundraiser ids the logged-in user actively hosts, in any role, loading it
 * once per identity via {@link useHostedFundraisersStore}. Pass `enabled: false`
 * to skip the fetch entirely (e.g. when the caller can already tell from the
 * page payload that the user is a host, or when nobody is logged in).
 *
 * `hostIds` is only returned when it belongs to the *current* identity, so a
 * cache left over from a previous user/impersonation is never surfaced.
 */
export function useHostedFundraiserIds({ enabled }: { enabled: boolean }): {
  hostIds: Set<string> | null;
} {
  const token = useAuthStore(state => state.accessToken);
  const userId = useAuthStore(state => state.user?.sub);
  const impersonationEmail = useImpersonationStore(state =>
    state.isActive ? state.email : null
  );

  const cachedIdentityKey = useHostedFundraisersStore(
    state => state.identityKey
  );
  const hostIds = useHostedFundraisersStore(state => state.hostIds);
  const ensureLoaded = useHostedFundraisersStore(state => state.ensureLoaded);

  // Namespace the cache by bearer token + impersonation target so a
  // login/logout/impersonation switch invalidates it automatically.
  const identityKey =
    token && userId ? `${token}::${impersonationEmail ?? ''}` : null;

  // Reloads on identity change, not on hosted fundraisers store reset(). A reset() hides the shortcut but won't re-run this effect, so a mounted consumer only recovers on remount. Safe today: reset() fires on dashboard/edit routes while this hook lives on the public page, so reaching the shortcut always remounts.
  useEffect(() => {
    if (!enabled || !identityKey || !token || !userId) return;
    // A non-host gets a normal 200 with an empty list, so what we catch here is a real failure (network, 5xx, timeout). Swallow it: non-fatal for this cosmetic control, it just means no edit shortcut.
    ensureLoaded(identityKey, token).catch(() => {});
  }, [enabled, identityKey, token, userId, ensureLoaded]);

  return {
    hostIds: cachedIdentityKey === identityKey ? hostIds : null,
  };
}

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useHostedFundraisersStore } from '@/stores/hosted-fundraisers-store';
import { useImpersonationStore } from '@/stores/impersonation-store';

/**
 * Returns the set of fundraiser ids the logged-in user owns/admins, loading it
 * once per identity via {@link useHostedFundraisersStore}. Pass `enabled: false`
 * to skip the fetch entirely (e.g. when the caller can already tell from the
 * page payload that the user is a host, or when nobody is logged in).
 *
 * `adminIds` is only returned when it belongs to the *current* identity, so a
 * cache left over from a previous user/impersonation is never surfaced.
 */
export function useHostedAdminIds({ enabled }: { enabled: boolean }): {
  adminIds: Set<string> | null;
} {
  const token = useAuthStore(state => state.accessToken);
  const userId = useAuthStore(state => state.user?.sub);
  const impersonationEmail = useImpersonationStore(state =>
    state.isActive ? state.email : null
  );

  const cachedIdentityKey = useHostedFundraisersStore(
    state => state.identityKey
  );
  const adminIds = useHostedFundraisersStore(state => state.adminIds);
  const ensureLoaded = useHostedFundraisersStore(state => state.ensureLoaded);

  // Namespace the cache by bearer token + impersonation target so a
  // login/logout/impersonation switch invalidates it automatically.
  const identityKey =
    token && userId ? `${token}::${impersonationEmail ?? ''}` : null;

  useEffect(() => {
    if (!enabled || !identityKey || !token || !userId) return;
    // Swallow errors (401/403 for non-hosts is expected and simply means "no
    // edit shortcut"); real failures are non-fatal for this cosmetic control.
    ensureLoaded(identityKey, token, userId).catch(() => {});
  }, [enabled, identityKey, token, userId, ensureLoaded]);

  return {
    adminIds: cachedIdentityKey === identityKey ? adminIds : null,
  };
}

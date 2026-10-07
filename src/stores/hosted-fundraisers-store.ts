import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getFundraisers } from '@/lib/api/fundraisers-service';

/**
 * Caches the set of fundraiser ids the current user actively hosts, in any role,
 * so the public-page host callout can tell whether a logged-in visitor hosts a
 * fundraiser they are *not* listed on publicly (private hosts are stripped from
 * the anonymous fundraiser payload).
 *
 * Why a store and not a per-page fetch:
 * - The source (`GET /profile/fundraisers`, the user's own hosted list) is identical
 *   regardless of which fundraiser page is open, so it is fetched ONCE per
 *   identity and reused across every fundraiser the user opens in a session.
 *   Cost is O(active logged-in users), not O(page views) — anonymous donor
 *   traffic pays nothing because the fetch only fires when logged in.
 * - `identityKey` (bearer token + impersonation target) namespaces the cache:
 *   login / logout / impersonation switch changes the key, so a stale cache is
 *   never served across identities and no manual invalidation is needed.
 * - `promise` dedupes in-flight requests: N components mounting at once share a
 *   single request instead of stampeding the API.
 *
 * Lives in memory for the session (survives client-side navigation, refetches
 * on hard reload). Staleness is low-risk: it only gates a dashboard shortcut; the
 * dashboard and API remain the real permission boundary.
 */
interface HostedFundraisersStore {
  /** Identity the cached `hostIds` belong to; null until first load. */
  identityKey: string | null;
  /** Fundraiser ids the user actively hosts in any role, view-only included; null while unloaded/in-flight. */
  hostIds: Set<string> | null;
  /** In-flight request for the current identity, for dedupe. */
  promise: Promise<Set<string>> | null;
  /**
   * Ensure the host id set for `identityKey` is loaded, returning it. Reuses a
   * completed cache or an in-flight promise for the same identity; otherwise
   * fetches fresh. Rejections (e.g. 401/403) are surfaced to the caller and
   * leave the cache empty so a later attempt can retry.
   */
  ensureLoaded: (identityKey: string, token: string) => Promise<Set<string>>;
  /**
   * Drop the cache so the next read refetches.
   * - Call after creating a fundraiser (the user gains one) or removing a host (can drop the user's own access).
   * - Also called on host role changes as cheap insurance, though self-demotion is API-rejected so a role change never changes the current user's own access in practice.
   * - Not needed when adding a host (you cannot add yourself), nor for plain fundraiser edits (they never touch host membership or roles).
   * - Not needed for impersonation switches: they window.location.reload(), which destroys the store anyway.
   */
  reset: () => void;
}

export const useHostedFundraisersStore = create<HostedFundraisersStore>()(
  devtools(
    (set, get) => ({
      identityKey: null,
      hostIds: null,
      promise: null,

      reset: () =>
        set(
          { identityKey: null, hostIds: null, promise: null },
          undefined,
          'hostedFundraisers/reset'
        ),

      ensureLoaded: (identityKey, token) => {
        const state = get();

        if (state.identityKey === identityKey) {
          if (state.hostIds) return Promise.resolve(state.hostIds);
          if (state.promise) return state.promise;
        }

        const promise = getFundraisers(token)
          .then(fundraisers => {
            // The list holds only fundraisers the user actively hosts, so every id in it is a host's.
            const hostIds = new Set(
              fundraisers.map(fundraiser => fundraiser.id)
            );
            // Only commit if this identity is still the one we fetched for; a
            // faster identity switch mid-flight must not be overwritten.
            if (get().identityKey === identityKey) {
              set(
                { hostIds, promise: null },
                undefined,
                'hostedFundraisers/loaded'
              );
            }
            return hostIds;
          })
          .catch(error => {
            if (get().identityKey === identityKey) {
              set({ promise: null }, undefined, 'hostedFundraisers/load_error');
            }
            throw error;
          });

        set(
          { identityKey, hostIds: null, promise },
          undefined,
          'hostedFundraisers/load_start'
        );
        return promise;
      },
    }),
    {
      name: 'HostedFundraisersStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

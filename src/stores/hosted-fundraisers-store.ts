import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getFundraisers } from '@/lib/api/fundraisers-service';
import { isFundraiserOwnerOrAdmin } from '@/lib/utils/fundraiser';

/**
 * Caches the set of fundraiser ids where the current user is an owner/admin
 * host, so surfaces like the public-page host-edit shortcut can tell whether a
 * logged-in visitor may edit a fundraiser they are *not* listed on publicly
 * (private hosts are stripped from the anonymous fundraiser payload).
 *
 * Why a store and not a per-page fetch:
 * - The source (`GET /fundraisers`, the user's own hosted list) is identical
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
 * on hard reload). Staleness is low-risk: it only gates an edit shortcut; the
 * dashboard and API remain the real permission boundary.
 */
interface HostedFundraisersStore {
  /** Identity the cached `adminIds` belong to; null until first load. */
  identityKey: string | null;
  /** Fundraiser ids the user owns/admins; null while unloaded/in-flight. */
  adminIds: Set<string> | null;
  /** In-flight request for the current identity, for dedupe. */
  promise: Promise<Set<string>> | null;
  /**
   * Ensure the admin id set for `identityKey` is loaded, returning it. Reuses a
   * completed cache or an in-flight promise for the same identity; otherwise
   * fetches fresh. Rejections (e.g. 401/403) are surfaced to the caller and
   * leave the cache empty so a later attempt can retry.
   */
  ensureLoaded: (
    identityKey: string,
    token: string,
    userId: string
  ) => Promise<Set<string>>;
}

export const useHostedFundraisersStore = create<HostedFundraisersStore>()(
  devtools(
    (set, get) => ({
      identityKey: null,
      adminIds: null,
      promise: null,

      ensureLoaded: (identityKey, token, userId) => {
        const state = get();

        if (state.identityKey === identityKey) {
          if (state.adminIds) return Promise.resolve(state.adminIds);
          if (state.promise) return state.promise;
        }

        const promise = getFundraisers(token)
          .then(fundraisers => {
            const adminIds = new Set(
              fundraisers
                .filter(fundraiser =>
                  isFundraiserOwnerOrAdmin(fundraiser, userId)
                )
                .map(fundraiser => fundraiser.id)
            );
            // Only commit if this identity is still the one we fetched for; a
            // faster identity switch mid-flight must not be overwritten.
            if (get().identityKey === identityKey) {
              set(
                { adminIds, promise: null },
                undefined,
                'hostedFundraisers/loaded'
              );
            }
            return adminIds;
          })
          .catch(error => {
            if (get().identityKey === identityKey) {
              set({ promise: null }, undefined, 'hostedFundraisers/load_error');
            }
            throw error;
          });

        set(
          { identityKey, adminIds: null, promise },
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

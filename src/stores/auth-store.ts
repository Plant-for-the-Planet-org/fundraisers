import type { UserProfile } from '@/lib/api/user-service';
import type {
  PartialIdentity,
  SignupFailureReason,
} from '@/lib/auth/implicit-signup';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { userService } from '@/lib/api/user-service';
import { AUTH0_CONFIG } from '@/lib/auth/auth0-config';
import { ensureProfile, isRetryable } from '@/lib/auth/implicit-signup';
import { DEFAULT_REDIRECT_PATH } from '@/lib/constants/auth';
import { getSafeRedirectPath, isProtectedRoute } from '@/lib/utils/auth';
import {
  IMPERSONATION_STORAGE_KEY,
  useImpersonationStore,
} from '@/stores/impersonation-store';
import { getClientLocale } from '@/i18n/locale-cookie';

interface User {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  profile?: UserProfile;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAuthInitializing: boolean;
  error: string | null;
  /** `error` means the user is signed in but has no profile yet, so anything that needs one must fall back. */
  profileStatus: 'ready' | 'error';
  profileFailureReason: SignupFailureReason | null;

  setAccessToken: (token: string | null) => Promise<void>;
  setIsAuthInitializing: (value: boolean) => void;
  loadUserProfile: () => Promise<void>;
  logout: (customReturnTo?: string | undefined) => void;
  clearAuth: () => void;
  refreshProfile: () => Promise<void>;
  retryProfileSetup: () => Promise<void>;
}

const isBrowser = typeof window !== 'undefined';

function userFromProfile(profile: UserProfile): User {
  return {
    sub: profile.id,
    email: profile.email,
    name: profile.displayName,
    picture: profile.image || undefined,
    profile,
  };
}

// Stands in until the profile exists. Enough for the header to show who is signed in; anything needing a profile checks `profileStatus`.
function userFromIdentity(identity: PartialIdentity): User {
  return {
    sub: identity.sub ?? '',
    email: identity.email ?? undefined,
    name: identity.name ?? undefined,
  };
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isAuthInitializing: true,
      error: null,
      profileStatus: 'ready',
      profileFailureReason: null,

      setIsAuthInitializing: (value: boolean) =>
        set({ isAuthInitializing: value }, undefined, {
          type: 'auth/set_is_authInitializing',
        }),

      setAccessToken: async (token: string | null) => {
        if (!token) {
          get().clearAuth();
          return;
        }

        if (get().accessToken === token) return;

        set({ accessToken: token }, undefined, {
          type: 'auth/set_access_token',
        });

        try {
          await get().loadUserProfile();
          const user = get().user;
          if (!user) throw new Error('User profile not loaded');

          if (isBrowser) {
            localStorage.setItem('access_token', token);
          }

          set({ isAuthenticated: true }, undefined, 'auth/set_authenticated');
        } catch (err) {
          console.error('Auth failed:', err);
          get().clearAuth();
        }
      },

      loadUserProfile: async () => {
        const { accessToken } = get();

        if (!accessToken) throw new Error('Missing access token');

        try {
          // Creates the profile if this is the user's first sign-in. Fundraisers has no signup form, so this is where an account becomes usable.
          const result = await ensureProfile(accessToken, getClientLocale());

          // Only a bad session signs the user out. A profile we could not create is worth staying signed in for, since a retry may well succeed.
          if (result.status === 'unauthorized') {
            throw new Error('Invalid token');
          }

          if (result.status === 'failed') {
            set(
              {
                user: userFromIdentity(result.identity),
                profileStatus: 'error',
                profileFailureReason: result.reason,
                error: null,
              },
              undefined,
              'auth/load_user_profile_degraded'
            );
            return;
          }

          set(
            {
              user: userFromProfile(result.profile),
              profileStatus: 'ready',
              profileFailureReason: null,
              error: null,
            },
            undefined,
            'auth/load_user_profile'
          );
        } catch (err) {
          console.error('Profile load failed:', err);
          set(
            { error: 'Authentication failed' },
            undefined,
            'auth/load_user_profile_error'
          );
          throw err;
        }
      },

      logout: (customReturnTo?: string) => {
        useImpersonationStore.getState().stop();
        if (isBrowser) {
          localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
        }

        const currentPage = window.location.pathname + window.location.search;
        const redirectAfterLogout = customReturnTo || currentPage;

        // If the redirect path is protected, fallback to default to avoid redirect loops
        const uncheckedRedirect = isProtectedRoute(redirectAfterLogout)
          ? DEFAULT_REDIRECT_PATH
          : redirectAfterLogout;
        // Ensure the redirect path is safe to prevent open redirect vulnerabilities
        const safeRedirect = getSafeRedirectPath(uncheckedRedirect);

        const auth0Domain = AUTH0_CONFIG.domain;
        const clientId = AUTH0_CONFIG.clientId;
        const baseUrl = window.location.origin;

        const logoutSuccessUrl = `${baseUrl}/redirecting?logoutSuccess=true&redirectTo=${encodeURIComponent(
          safeRedirect
        )}`;

        const logoutUrl = new URL(`https://${auth0Domain}/v2/logout`);
        logoutUrl.searchParams.set('client_id', clientId!);
        logoutUrl.searchParams.set('returnTo', logoutSuccessUrl);

        window.location.href = logoutUrl.toString();
      },

      clearAuth: () => {
        useImpersonationStore.getState().stop();
        if (isBrowser) {
          localStorage.removeItem('access_token');
          localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
          // The `ui-locale` cookie is intentionally left in place. A profile sync taught this browser the user's language; logging out should not discard that (the profile is not lost, it re-syncs on the next login).
          // A later different user's profile sync overwrites the `.profile` cookie anyway, and an explicit pick always wins.
        }
        set(
          {
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isAuthInitializing: false,
            error: null,
            profileStatus: 'ready',
            profileFailureReason: null,
          },
          undefined,
          'auth/clear_auth'
        );
      },

      retryProfileSetup: async () => {
        const { accessToken, profileStatus, profileFailureReason } = get();

        if (!accessToken || profileStatus === 'ready') return;
        if (!profileFailureReason || !isRetryable(profileFailureReason)) return;

        const result = await ensureProfile(accessToken, getClientLocale());

        if (result.status === 'unauthorized') {
          get().clearAuth();
          return;
        }

        if (result.status === 'failed') {
          set(
            { profileFailureReason: result.reason },
            undefined,
            'auth/retry_profile_setup_failed'
          );
          return;
        }

        set(
          {
            user: userFromProfile(result.profile),
            profileStatus: 'ready',
            profileFailureReason: null,
          },
          undefined,
          'auth/retry_profile_setup'
        );
      },

      refreshProfile: async () => {
        const { accessToken, user } = get();

        if (!accessToken || !user) return;

        try {
          const result = await userService.getProfileSafe(accessToken);
          if (result.status !== 'ok') {
            get().clearAuth();
            return;
          }

          // Rebuild from the profile rather than merging, so a changed name or email reaches `user` too.
          set(
            { user: userFromProfile(result.profile), error: null },
            undefined,
            'auth/refresh_profile'
          );
        } catch (err) {
          console.error('Failed to refresh profile:', err);
          set(
            { error: 'Failed to refresh profile' },
            undefined,
            'auth/refresh_profile_error'
          );
        }
      },
    }),
    {
      name: 'AuthStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

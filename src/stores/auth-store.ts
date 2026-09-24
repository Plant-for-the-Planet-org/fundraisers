import type { UserProfile } from '@/lib/api/user-service';
import type {
  PartialIdentity,
  SignupFailureReason,
} from '@/lib/auth/implicit-signup';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { userService } from '@/lib/api/user-service';
import {
  clearAuthTime,
  readAuthTime,
  restoreAuthTime,
} from '@/lib/auth/auth-time';
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
  /** Seconds since the epoch of the last interactive sign-in, see `auth-time.ts`. Null when unknown. */
  authTime: number | null;
  isAuthenticated: boolean;
  isAuthInitializing: boolean;
  error: string | null;
  /** `error` means the user is signed in but has no profile yet, so anything that needs one must fall back. */
  profileStatus: 'ready' | 'error';
  profileFailureReason: SignupFailureReason | null;

  setAccessToken: (token: string | null) => Promise<void>;
  /** Switches accounts and keeps the current session if the new account fails to load. */
  switchAccount: (token: string) => Promise<boolean>;
  setIsAuthInitializing: (value: boolean) => void;
  loadUserProfile: () => Promise<void>;
  logout: (customReturnTo?: string | undefined) => void;
  clearAuth: () => void;
  refreshProfile: () => Promise<void>;
  /** Saves the language to the signed-in user's profile. Throws when the save fails. */
  updateProfileLocale: (locale: string) => Promise<void>;
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

/**
 * Applies a new login session:
 * - saves the new token
 * - loads the user's profile
 * - marks the user as signed in
 *
 * If anything fails, this throws an error.
 * The caller decides whether to sign out or restore the previous session.
 */
async function applySession(token: string) {
  useAuthStore.setState({ accessToken: token }, undefined, {
    type: 'auth/set_access_token',
  });

  await useAuthStore.getState().loadUserProfile();
  if (!useAuthStore.getState().user) {
    throw new Error('User profile not loaded');
  }

  if (isBrowser) {
    localStorage.setItem('access_token', token);
  }

  useAuthStore.setState(
    { isAuthenticated: true, authTime: readAuthTime() },
    undefined,
    'auth/set_authenticated'
  );
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      user: null,
      accessToken: null,
      authTime: null,
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

        try {
          await applySession(token);
        } catch (err) {
          console.error('Auth failed:', err);
          get().clearAuth();
        }
      },

      switchAccount: async (token: string) => {
        // Everything `applySession` and `loadUserProfile` touch, so a rollback puts the session back exactly as it stood.
        const previous = {
          user: get().user,
          accessToken: get().accessToken,
          authTime: get().authTime,
          isAuthenticated: get().isAuthenticated,
          error: get().error,
          profileStatus: get().profileStatus,
          profileFailureReason: get().profileFailureReason,
        };

        if (previous.accessToken === token) return previous.isAuthenticated;

        try {
          await applySession(token);
          return true;
        } catch (err) {
          // If the new account fails to load, keep the user signed in to the previous account.
          console.error('Account switch failed, keeping the session:', err);
          set(previous, undefined, 'auth/switch_account_reverted');
          restoreAuthTime(previous.authTime);
          return false;
        }
      },

      loadUserProfile: async () => {
        const { accessToken } = get();

        if (!accessToken) throw new Error('Missing access token');

        try {
          // Creates the profile if this is the user's first sign-in. Fundraisers has no signup form, so this is where an account becomes usable.
          const result = await ensureProfile(accessToken, getClientLocale());

          // A profile we could not create is worth staying signed in for, since a retry may well succeed.
          // Everything else is a dead end: nothing the user does will make this session work, so keeping them signed in only hides that.
          if (
            result.status === 'unauthorized' ||
            (result.status === 'failed' && !isRetryable(result.reason))
          ) {
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
          clearAuthTime();
          // The `ui-locale` cookie is intentionally left in place. A profile sync taught this browser the user's language; logging out should not discard that (the profile is not lost, it re-syncs on the next login).
          // A later different user's profile sync overwrites the `.profile` cookie anyway, and an explicit pick always wins.
        }
        set(
          {
            user: null,
            accessToken: null,
            authTime: null,
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

        // Same rule as the initial load: stay signed in only while trying again could still work. A retry can turn up a new reason, such as an account deleted since the last attempt.
        if (
          result.status === 'unauthorized' ||
          (result.status === 'failed' && !isRetryable(result.reason))
        ) {
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

      updateProfileLocale: async (locale: string) => {
        const { accessToken, user } = get();
        if (!accessToken || !user?.profile) return;

        await userService.updateProfileLocale(accessToken, locale);
        // Merge rather than trust the response shape, so a partial reply cannot drop other profile fields.
        set(
          { user: { ...user, profile: { ...user.profile, locale } } },
          undefined,
          'auth/update_profile_locale'
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

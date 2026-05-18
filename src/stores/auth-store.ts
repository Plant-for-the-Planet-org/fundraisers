import type { UserProfile } from '@/lib/api/user-service';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { userService } from '@/lib/api/user-service';
import { AUTH0_CONFIG } from '@/lib/auth/auth0-config';
import { DEFAULT_REDIRECT_PATH } from '@/lib/constants/auth';
import { getSafeRedirectPath, isProtectedRoute } from '@/lib/utils/auth';
import {
  IMPERSONATION_STORAGE_KEY,
  useImpersonationStore,
} from '@/stores/impersonation-store';

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

  setAccessToken: (token: string | null) => Promise<void>;
  setIsAuthInitializing: (value: boolean) => void;
  loadUserProfile: () => Promise<void>;
  logout: (customReturnTo?: string | undefined) => void;
  clearAuth: () => void;
  refreshProfile: () => Promise<void>;
}

const isBrowser = typeof window !== 'undefined';

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isAuthInitializing: true,
      error: null,

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
          const profile = await userService.getProfileSafe(accessToken);

          if (!profile) throw new Error('Invalid token');

          const user: User = {
            sub: profile.id,
            email: profile.email,
            name: profile.displayName,
            picture: profile.image || undefined,
            profile,
          };

          set({ user, error: null }, undefined, 'auth/load_user_profile');
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
        }
        set(
          {
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isAuthInitializing: false,
            error: null,
          },
          undefined,
          'auth/clear_auth'
        );
      },

      refreshProfile: async () => {
        const { accessToken, user } = get();

        if (!accessToken || !user) return;

        try {
          const profile = await userService.getProfileSafe(accessToken);
          if (!profile) {
            get().clearAuth();
            return;
          }

          set(
            { user: { ...user, profile }, error: null },
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

import type { UserProfile } from '@/lib/api/user-service';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { userService } from '@/lib/api/user-service';
import { DEFAULT_REDIRECT_PATH } from '@/lib/constants/auth';
import { isProtectedRoute } from '@/lib/utils/auth';

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
        const currentPage = window.location.pathname + window.location.search;
        const redirectAfterLogout = customReturnTo || currentPage;

        const safeRedirect = isProtectedRoute(redirectAfterLogout)
          ? DEFAULT_REDIRECT_PATH
          : redirectAfterLogout;

        const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
        const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
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
        if (isBrowser) {
          localStorage.removeItem('access_token');
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

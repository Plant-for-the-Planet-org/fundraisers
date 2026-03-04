import type { UserProfile } from '@/lib/api/user-service';

import { create } from 'zustand';
import { userService } from '@/lib/api/user-service';

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
  isLoading: boolean;
  error: string | null;

  setAccessToken: (token: string | null) => void;
  loadUserProfile: () => Promise<void>;
  logout: (customReturnTo?: string | undefined) => void;
  clearAuth: () => void;
}

const isBrowser = typeof window !== 'undefined';

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Only responsible for:
   * - Setting token
   * - Triggering profile load
   */
  setAccessToken: async token => {
    if (!token) {
      get().clearAuth();
      return;
    }
    if (get().accessToken === token) return;

    set({ accessToken: token, isAuthenticated: true });

    if (isBrowser) {
      localStorage.setItem('access_token', token);
    }
    document.cookie = `is-authenticated=true; path=/; secure; samesite=lax`;
    await get().loadUserProfile();
  },

  /**
   * Responsible ONLY for fetching user profile
   */
  loadUserProfile: async () => {
    const { accessToken } = get();
    if (!accessToken) return;

    try {
      set({ isLoading: true });

      const profile = await userService.getProfileSafe(accessToken);

      if (!profile) {
        throw new Error('Invalid token');
      }

      const user: User = {
        sub: profile.id,
        email: profile.email,
        name: profile.displayName,
        picture: profile.image || undefined,
        profile,
      };

      set({ user, error: null });
    } catch (err) {
      console.error('Profile load failed:', err);
      set({ error: 'Authentication failed' });
      get().clearAuth();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: (customReturnTo?: string) => {
    get().clearAuth();

    // Capture current page for redirect after logout
    const currentPage = window.location.pathname + window.location.search;
    const redirectAfterLogout = customReturnTo || currentPage;

    // Redirect to Auth0 logout with our logout success endpoint
    const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
    const baseUrl = window.location.origin;

    // Use the login page with logout success and redirect parameters
    const logoutSuccessUrl = `${baseUrl}/login?logoutSuccess=true&redirectTo=${encodeURIComponent(redirectAfterLogout)}`;

    const logoutUrl = new URL(`https://${auth0Domain}/v2/logout`);
    logoutUrl.searchParams.set('client_id', clientId!);
    logoutUrl.searchParams.set('returnTo', logoutSuccessUrl);

    window.location.href = logoutUrl.toString();
  },

  clearAuth: () => {
    if (isBrowser) {
      localStorage.removeItem('access_token');
      document.cookie =
        'is-authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax';
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      error: null,
      isLoading: false,
    });
  },
}));

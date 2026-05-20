import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const IMPERSONATION_STORAGE_KEY = 'impersonation-state';

interface ImpersonationStore {
  email: string | null;
  pin: string | null;
  isActive: boolean;
  start: (email: string, pin: string) => void;
  stop: () => void;
}

export const useImpersonationStore = create<ImpersonationStore>()(
  devtools(
    persist(
      set => ({
        email: null,
        pin: null,
        isActive: false,
        start: (email, pin) =>
          set({ email, pin, isActive: true }, undefined, 'impersonation/start'),
        stop: () =>
          set(
            { email: null, pin: null, isActive: false },
            undefined,
            'impersonation/stop'
          ),
      }),
      {
        name: IMPERSONATION_STORAGE_KEY,
      }
    ),
    {
      name: 'ImpersonationStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

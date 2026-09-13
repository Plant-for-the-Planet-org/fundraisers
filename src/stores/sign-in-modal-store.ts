import { create } from 'zustand';

interface SignInModalStore {
  isOpen: boolean;
  /** Where to land once signed in. Same-tab path with query, as the caller saw it. */
  returnTo: string | null;
  open: (returnTo: string) => void;
  close: () => void;
}

export const useSignInModalStore = create<SignInModalStore>()(set => ({
  isOpen: false,
  returnTo: null,
  open: returnTo => set({ isOpen: true, returnTo }),
  close: () => set({ isOpen: false, returnTo: null }),
}));

export function openSignInModal(returnTo: string) {
  useSignInModalStore.getState().open(returnTo);
}

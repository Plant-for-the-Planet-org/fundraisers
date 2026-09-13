import { create } from 'zustand';

/** `switch-account` opens the same form for someone who is already signed in and wants a different account. */
export type SignInModalMode = 'sign-in' | 'switch-account';

interface SignInModalStore {
  isOpen: boolean;
  mode: SignInModalMode;
  /** Where to land once signed in. Same-tab path with query, as the caller saw it. */
  returnTo: string | null;
  open: (returnTo: string, mode?: SignInModalMode) => void;
  close: () => void;
}

export const useSignInModalStore = create<SignInModalStore>()(set => ({
  isOpen: false,
  mode: 'sign-in',
  returnTo: null,
  open: (returnTo, mode = 'sign-in') => set({ isOpen: true, returnTo, mode }),
  close: () => set({ isOpen: false, returnTo: null, mode: 'sign-in' }),
}));

export function openSignInModal(
  returnTo: string,
  mode: SignInModalMode = 'sign-in'
) {
  useSignInModalStore.getState().open(returnTo, mode);
}

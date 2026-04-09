import type { Theme } from '@/lib/theme/types';

import { create } from 'zustand';

interface ThemeOverrideState {
  selectedTheme: Theme | null;
  setSelectedTheme: (theme: Theme | null) => void;
}

export const useThemeStore = create<ThemeOverrideState>(set => ({
  selectedTheme: null,
  setSelectedTheme: theme => set({ selectedTheme: theme }),
}));

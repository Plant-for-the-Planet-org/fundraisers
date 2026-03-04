import { create } from 'zustand';
import type { Theme } from '@/lib/theme/types';

interface ThemeOverrideState {
  selectedTheme: Theme | null;
  setSelectedTheme: (theme: Theme | null) => void;
}

export const useThemeStore = create<ThemeOverrideState>(set => ({
  selectedTheme: null,
  setSelectedTheme: theme => set({ selectedTheme: theme }),
}));

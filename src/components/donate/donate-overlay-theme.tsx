'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { createContext, useContext, useMemo } from 'react';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { buildTheme } from '@/lib/theme/build-theme';
import { getFontStack } from '@/lib/theme/font-utils';

type DonateThemeContextValue = { mode: 'light' | 'dark' };

const DonateThemeContext = createContext<DonateThemeContextValue>({
  mode: 'light',
});

export function useDonateThemeMode(): 'light' | 'dark' {
  return useContext(DonateThemeContext).mode;
}

interface ThemedPortalRootProps {
  fundraiser: Fundraiser;
  children: React.ReactNode;
}

export function ThemedPortalRoot({
  fundraiser,
  children,
}: ThemedPortalRootProps) {
  const theme = useMemo(
    () => buildTheme(fundraiser.settings?.theme ?? null),
    [fundraiser.settings?.theme]
  );
  const contextValue = useMemo(() => ({ mode: theme.mode }), [theme.mode]);

  return (
    <DonateThemeContext.Provider value={contextValue}>
      <div
        className={`theme-${theme.id} ${theme.mode} fixed inset-0 z-50 overflow-auto`}
        data-theme={theme.id}
        style={
          {
            fontFamily: getFontStack(theme.bodyFont),
            '--theme-title-font': getFontStack(theme.titleFont),
            '--accent-color': getAccentColor(theme.accent),
          } as React.CSSProperties
        }
      >
        <div
          className={`fixed inset-0 ${theme.background} transition-colors duration-300`}
        />
        <div className='relative z-10'>{children}</div>
      </div>
    </DonateThemeContext.Provider>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { getFontStack } from '@/lib/theme/font-utils';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { useThemeStore } from '@/stores/theme-store';

export function ThemeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { selectedTheme, setSelectedTheme } = useThemeStore();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setSelectedTheme(null);
    }
  }, [pathname, setSelectedTheme]);

  const activeTheme = selectedTheme ?? getThemeForPath(pathname);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(activeTheme.mode);
  }, [activeTheme.mode]);

  return (
    <div
      className={`theme-${activeTheme.id} ${activeTheme.mode} relative min-h-screen flex flex-col`}
      data-theme={activeTheme.id}
      style={
        {
          fontFamily: getFontStack(activeTheme.bodyFont),
          '--theme-title-font': getFontStack(activeTheme.titleFont),
          '--accent-color': getAccentColor(activeTheme.accent),
        } as React.CSSProperties
      }
    >
      <div
        className={`fixed inset-0 ${activeTheme.background} transition-colors duration-300`}
      />
      <div className='relative z-10 flex flex-col min-h-screen'>{children}</div>
    </div>
  );
}

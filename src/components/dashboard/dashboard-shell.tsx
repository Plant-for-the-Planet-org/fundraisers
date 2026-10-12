'use client';

import type { ReactNode } from 'react';
import type { CSSProperties } from 'react';

import { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { hexToHslTriplet } from '@/lib/theme/color-utils';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { DashboardNav } from './dashboard-nav';

const InsightsEnabledContext = createContext(false);

/** Whether this deployment has Umami set up, decided on the server and handed down by the menu layout. */
export function useInsightsEnabled(): boolean {
  return useContext(InsightsEnabledContext);
}

export function DashboardShell({
  children,
  insightsEnabled,
}: {
  children: ReactNode;
  insightsEnabled: boolean;
}) {
  const pathname = usePathname();

  // Marks, icons and links use the theme's --accent-color directly. The shadcn Button is hard-wired to `primary`, so the accent is mirrored into --primary for buttons.
  const primary = hexToHslTriplet(
    getAccentColor(getThemeForPath(pathname).accent)
  );

  // Dialogs and menus portal to <body>, outside this wrapper, so the root element carries it too while the dashboard is open.
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty('--primary', primary);
    return () => {
      html.style.removeProperty('--primary');
    };
  }, [primary]);

  return (
    <InsightsEnabledContext.Provider value={insightsEnabled}>
      <div
        className='flex flex-col gap-4 md:flex-row md:gap-6'
        style={{ '--primary': primary } as CSSProperties}
      >
        {/* The menu is always open: a column beside the content, and on a small screen a row above it. */}
        <aside className='shrink-0 md:w-48'>
          <div className='md:sticky md:top-8'>
            <DashboardNav insightsEnabled={insightsEnabled} />
          </div>
        </aside>

        <div className='min-w-0 flex-1'>{children}</div>
      </div>
    </InsightsEnabledContext.Provider>
  );
}

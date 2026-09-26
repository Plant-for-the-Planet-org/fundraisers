'use client';

import type { ReactNode } from 'react';
import type { CSSProperties } from 'react';

import { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { hexToHslTriplet } from '@/lib/theme/color-utils';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { cn } from '@/lib/utils/cn';
import { SidebarIcon } from '@/components/ui/ui-icons';
import { DashboardNav } from './dashboard-nav';
import { useMenuCollapsed } from './use-menu-collapsed';

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
  const t = useTranslations('Dashboard.nav');
  const [collapsed, toggleCollapsed] = useMenuCollapsed();
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
        {/* One menu for all sizes. Small screens: a row of icons when collapsed, the full list when expanded, since three labels do not fit in a row on a phone. Desktop: the side rail. */}
        {/* No width animation: the content would reflow on every frame of it. */}
        <aside className={cn('shrink-0', collapsed ? 'md:w-10' : 'md:w-48')}>
          <div
            className={cn(
              'flex gap-1 md:sticky md:top-8 md:flex-col md:gap-2',
              collapsed ? 'flex-row items-center' : 'flex-col'
            )}
          >
            <DashboardNav
              collapsed={collapsed}
              insightsEnabled={insightsEnabled}
            />
            {/* Laid out like a menu item, so its icon lines up with the ones above in both states. */}
            <button
              type='button'
              onClick={toggleCollapsed}
              aria-label={collapsed ? t('expand') : t('collapse')}
              aria-expanded={!collapsed}
              title={collapsed ? t('expand') : t('collapse')}
              className='flex h-9 items-center rounded-md px-3 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground'
            >
              <SidebarIcon className='size-4 shrink-0' />
            </button>
          </div>
        </aside>

        <div className='min-w-0 flex-1'>{children}</div>
      </div>
    </InsightsEnabledContext.Provider>
  );
}

'use client';

import type { ReactNode } from 'react';
import type { CSSProperties } from 'react';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { hexToHslTriplet } from '@/lib/theme/color-utils';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { BarsIcon, SidebarIcon } from '@/components/ui/ui-icons';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        {/* No width animation: the content would reflow on every frame of it. */}
        <aside
          className={cn(
            'hidden shrink-0 md:block',
            collapsed ? 'w-10' : 'w-48'
          )}
        >
          <div className='sticky top-8 flex flex-col gap-2'>
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

        <div className='md:hidden'>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant='outline' size='sm'>
                <BarsIcon />
                {t('openMenu')}
              </Button>
            </SheetTrigger>
            <SheetContent aria-describedby={undefined}>
              <SheetTitle>{t('label')}</SheetTitle>
              <DashboardNav
                insightsEnabled={insightsEnabled}
                onNavigate={() => setIsMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className='min-w-0 flex-1'>{children}</div>
      </div>
    </InsightsEnabledContext.Provider>
  );
}

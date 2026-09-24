'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import {
  ChartSimpleIcon,
  HandHoldingHeartIcon,
  HouseIcon,
} from '@/components/ui/ui-icons';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    labelKey: 'overview',
    icon: HouseIcon,
    isActive: (pathname: string) => pathname === '/dashboard',
  },
  {
    href: '/dashboard/fundraisers',
    labelKey: 'fundraisers',
    icon: HandHoldingHeartIcon,
    // The edit page lives under this item too.
    isActive: (pathname: string) =>
      pathname.startsWith('/dashboard/fundraisers'),
  },
  {
    href: '/dashboard/insights',
    labelKey: 'insights',
    icon: ChartSimpleIcon,
    isActive: (pathname: string) => pathname.startsWith('/dashboard/insights'),
  },
] as const;

interface DashboardNavProps {
  /** Lets the mobile sheet close itself after a link is picked. */
  onNavigate?: () => void;
  /** Icons only; the label stays for screen readers and shows as a tooltip. */
  collapsed?: boolean;
  /** Insights needs the Umami key, so the item only shows where one is set. */
  insightsEnabled?: boolean;
}

export function DashboardNav({
  onNavigate,
  collapsed = false,
  insightsEnabled = false,
}: DashboardNavProps) {
  const t = useTranslations('Dashboard.nav');
  const pathname = usePathname();

  return (
    <nav aria-label={t('label')}>
      <ul className='m-0 flex list-none flex-col gap-1 p-0'>
        {NAV_ITEMS.filter(
          item => item.labelKey !== 'insights' || insightsEnabled
        ).map(({ href, labelKey, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? t(labelKey) : undefined}
                className={cn(
                  // Fixed height and padding, so rows keep their size with or without the label and the icons stay put when the menu is toggled.
                  'flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-accent-color/10 text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                {/* The current page's icon takes the accent; its duotone back layer becomes a soft tint of it. */}
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    active && 'text-accent-color'
                  )}
                />
                <span className={cn(collapsed && 'sr-only')}>
                  {t(labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

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
  /** Insights needs the Umami key, so the item only shows where one is set. */
  insightsEnabled?: boolean;
}

export function DashboardNav({ insightsEnabled = false }: DashboardNavProps) {
  const t = useTranslations('Dashboard.nav');
  const pathname = usePathname();

  return (
    <nav aria-label={t('label')}>
      {/* The menu is always open: a column beside the content, and on a small screen a row above it. */}
      <ul className='m-0 flex list-none flex-row gap-1 rounded-xl border border-border/60 bg-background/60 p-1 md:flex-col md:rounded-none md:border-0 md:bg-transparent md:p-0'>
        {NAV_ITEMS.filter(
          item => item.labelKey !== 'insights' || insightsEnabled
        ).map(({ href, labelKey, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <li key={href} className='max-md:flex-1'>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  // Fixed height and padding, so every row is the same size.
                  'flex items-center rounded-md text-sm font-medium whitespace-nowrap transition-colors max-md:h-14 max-md:flex-col max-md:justify-center max-md:gap-1 max-md:text-xs md:h-9 md:gap-2 md:px-3',
                  active
                    ? 'bg-accent-color/10 text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                {/* The current page's icon takes the accent; its duotone back layer becomes a soft tint of it. */}
                <Icon
                  className={cn(
                    'size-5 shrink-0 md:size-4',
                    active && 'text-accent-color'
                  )}
                />
                <span>{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

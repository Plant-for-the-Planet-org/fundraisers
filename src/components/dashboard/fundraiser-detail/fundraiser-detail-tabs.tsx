'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

export function FundraiserDetailTabs({
  slug,
  insightsEnabled,
}: {
  slug: string;
  insightsEnabled: boolean;
}) {
  const t = useTranslations('Dashboard.fundraiser.tabs');
  const pathname = usePathname();
  const base = `/dashboard/fundraisers/${encodeURIComponent(slug)}`;

  const tabs = [
    { href: base, label: t('overview') },
    { href: `${base}/donors`, label: t('donors') },
    ...(insightsEnabled
      ? [{ href: `${base}/insights`, label: t('insights') }]
      : []),
    { href: `${base}/share`, label: t('share') },
  ];

  return (
    <nav className='border-b border-border'>
      <ul className='m-0 -mb-px flex list-none gap-6 p-0'>
        {tabs.map(tab => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-block border-b-2 pb-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

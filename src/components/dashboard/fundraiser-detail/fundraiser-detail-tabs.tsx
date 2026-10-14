'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { useReshareMoment } from './reshare-moment';

export function FundraiserDetailTabs({
  slug,
  insightsEnabled,
  fundraiser,
}: {
  slug: string;
  insightsEnabled: boolean;
  fundraiser: Fundraiser;
}) {
  const t = useTranslations('Dashboard.fundraiser.tabs');
  const pathname = usePathname();
  const base = `/dashboard/fundraisers/${encodeURIComponent(slug)}`;
  // A dot on Share while there is news worth sharing again: a milestone, the goal, or the first donors.
  const shareDot = useReshareMoment(fundraiser) !== null;

  const tabs = [
    { href: base, label: t('overview'), dot: false },
    { href: `${base}/donors`, label: t('donors'), dot: false },
    ...(insightsEnabled
      ? [{ href: `${base}/insights`, label: t('insights'), dot: false }]
      : []),
    { href: `${base}/share`, label: t('share'), dot: shareDot },
    { href: `${base}/stage`, label: t('stage'), dot: false },
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
                {tab.dot && (
                  <>
                    <span
                      aria-hidden='true'
                      className='ml-1.5 inline-block size-2 rounded-full bg-accent-color align-middle'
                    />
                    <span className='sr-only'>{t('shareNew')}</span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

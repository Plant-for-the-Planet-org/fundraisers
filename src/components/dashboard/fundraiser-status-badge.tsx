'use client';

import type { DisplayStatus } from '@/lib/utils/fundraiser-list';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/index';

interface FundraiserStatusBadgeProps {
  status: DisplayStatus;
  className?: string;
}

const STATUS_DOT_CLASS: Record<DisplayStatus, string> = {
  active: 'bg-emerald-500',
  paused: 'bg-muted-foreground/60',
  ended: 'bg-muted-foreground/40',
  'ending-soon': 'bg-amber-500',
};

const STATUS_BADGE_CLASS: Record<DisplayStatus, string> = {
  active:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  paused:
    'border border-border bg-zinc-100 text-muted-foreground dark:bg-zinc-800/60',
  ended:
    'border border-border bg-zinc-100 text-muted-foreground dark:bg-zinc-800/60',
  'ending-soon':
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
};

export function FundraiserStatusBadge({
  status,
  className,
}: FundraiserStatusBadgeProps) {
  const t = useTranslations('Dashboard.statusBadge');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium leading-none',
        STATUS_BADGE_CLASS[status],
        className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT_CLASS[status])}
        aria-hidden='true'
      />
      {t(status)}
    </span>
  );
}

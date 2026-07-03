'use client';

import type { DisplayStatus } from '@/lib/utils/fundraiser-list';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/index';

interface FundraiserStatusBadgeProps {
  status: DisplayStatus;
  className?: string;
}

const STATUS_INDICATOR_STYLES: Record<DisplayStatus, string> = {
  active: 'bg-success',
  draft: 'bg-muted-foreground/60',
  paused: 'bg-muted-foreground/60',
  ended: 'bg-muted-foreground/40',
  'ending-soon': 'bg-warning',
};

const STATUS_BADGE_STYLES: Record<DisplayStatus, string> = {
  active: 'bg-success/15 text-success',
  draft: 'border border-border bg-muted text-muted-foreground',
  paused: 'border border-border bg-muted text-muted-foreground',
  ended: 'border border-border bg-muted text-muted-foreground',
  'ending-soon': 'bg-warning/15 text-warning',
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
        STATUS_BADGE_STYLES[status],
        className
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          STATUS_INDICATOR_STYLES[status]
        )}
        aria-hidden='true'
      />
      {t(status)}
    </span>
  );
}

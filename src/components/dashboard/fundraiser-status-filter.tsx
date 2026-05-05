'use client';

import type {
  FundraiserListStatusFilter,
  FundraiserStatusCounts,
} from '@/lib/utils/fundraiser-list';

import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/index';

interface FundraiserStatusFilterProps {
  value: FundraiserListStatusFilter;
  counts: FundraiserStatusCounts;
  onChange: (next: FundraiserListStatusFilter) => void;
  className?: string;
}

const STATUS_FILTER_OPTIONS: FundraiserListStatusFilter[] = [
  'all',
  'active',
  'draft',
  'paused',
  'ended',
];

export function FundraiserStatusFilter({
  value,
  counts,
  onChange,
  className,
}: FundraiserStatusFilterProps) {
  const t = useTranslations('Dashboard.statusFilter');
  const locale = useLocale();

  return (
    <div
      role='radiogroup'
      aria-label={t('groupLabel')}
      className={cn(
        'fundraiser-status-filter flex h-11 shrink-0 items-center justify-between gap-1 overflow-x-auto rounded-xl border border-border/60 bg-muted px-1 shadow-xs md:inline-flex md:justify-start md:overflow-x-visible',
        className
      )}
    >
      {STATUS_FILTER_OPTIONS.map(option => {
        const isSelected = option === value;
        return (
          <button
            key={option}
            type='button'
            role='radio'
            aria-checked={isSelected}
            onClick={() => onChange(option)}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors',
              isSelected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{t(option)}</span>
            <span
              className={cn(
                'inline-flex min-w-4 items-center justify-center rounded-full px-1 text-xs font-medium',
                isSelected
                  ? 'bg-muted text-foreground'
                  : 'bg-background/70 text-muted-foreground'
              )}
            >
              {counts[option].toLocaleString(locale)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

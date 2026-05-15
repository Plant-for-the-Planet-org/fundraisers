'use client';

import type {
  FundraiserListStatusFilter,
  FundraiserStatusCounts,
} from '@/lib/utils/fundraiser-list';

import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/index';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FundraiserStatusFilterProps {
  value: FundraiserListStatusFilter;
  statusCounts: FundraiserStatusCounts;
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
  statusCounts,
  onChange,
  className,
}: FundraiserStatusFilterProps) {
  const t = useTranslations('Dashboard.statusFilter');
  const locale = useLocale();

  return (
    <Tabs
      value={value}
      onValueChange={v => onChange(v as FundraiserListStatusFilter)}
      className={cn('fundraiser-status-filter', className)}
    >
      <TabsList className='w-full shrink-0 justify-between overflow-x-auto md:w-fit md:justify-start md:overflow-x-visible'>
        {STATUS_FILTER_OPTIONS.map(option => (
          <TabsTrigger key={option} value={option} className='gap-1.5 px-4'>
            <span>{t(option)}</span>
            <span
              className={cn(
                'inline-flex min-w-4 items-center justify-center rounded-full px-1 text-xs font-medium',
                value === option
                  ? 'bg-muted text-foreground'
                  : 'bg-background/70 text-muted-foreground'
              )}
            >
              {statusCounts[option].toLocaleString(locale)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

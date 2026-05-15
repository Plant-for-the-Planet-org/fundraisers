'use client';

import type {
  FundraiserListStatusFilter,
  FundraiserStatusCounts,
} from '@/lib/utils/fundraiser-list';

import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/index';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            aria-label={t('groupLabel')}
            className={cn(
              'h-11 w-full justify-between rounded-xl border-border/60 bg-background px-4 has-[>svg]:px-4 md:hidden',
              className
            )}
          >
            <span className='inline-flex min-w-0 items-center gap-1.5 truncate'>
              <span className='truncate font-medium text-foreground'>
                {t(value)}
              </span>
              <span className='inline-flex min-w-4 items-center justify-center rounded-full bg-muted px-1 text-xs font-medium text-muted-foreground'>
                {statusCounts[value].toLocaleString(locale)}
              </span>
            </span>
            <ChevronDown className='ml-2 h-4 w-4 shrink-0' aria-hidden='true' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='w-52 rounded-xl border-border/60 shadow-lg'
        >
          {STATUS_FILTER_OPTIONS.map(option => {
            const isSelected = option === value;
            return (
              <DropdownMenuItem
                key={option}
                onSelect={() => onChange(option)}
                className='gap-2'
              >
                <span className='flex h-4 w-4 items-center justify-center'>
                  {isSelected && (
                    <Check
                      className='h-4 w-4 text-emerald-600 dark:text-emerald-400'
                      aria-hidden='true'
                    />
                  )}
                </span>
                <span className='flex-1'>{t(option)}</span>
                <span className='inline-flex min-w-4 items-center justify-center rounded-full bg-muted px-1 text-xs font-medium text-muted-foreground'>
                  {statusCounts[option].toLocaleString(locale)}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        role='toolbar'
        aria-label={t('groupLabel')}
        className={cn(
          'fundraiser-status-filter hidden h-11 shrink-0 items-center gap-1 rounded-xl border border-border/60 bg-muted px-1 shadow-xs md:inline-flex',
          className
        )}
      >
        {STATUS_FILTER_OPTIONS.map(option => {
          const isSelected = option === value;
          return (
            <button
              key={option}
              type='button'
              aria-pressed={isSelected}
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
                {statusCounts[option].toLocaleString(locale)}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

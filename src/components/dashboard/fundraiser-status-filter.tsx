'use client';

import type {
  FundraiserListStatusFilter,
  FundraiserStatusCounts,
} from '@/lib/utils/fundraiser-list';

import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronDown, ListFilter } from 'lucide-react';
import { cn, formatCompactNumber } from '@/lib/utils/index';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface FundraiserStatusFilterProps {
  value: FundraiserListStatusFilter;
  statusCounts: FundraiserStatusCounts;
  onChange: (next: FundraiserListStatusFilter) => void;
  inlineFilterClassName?: string;
  dropdownFilterClassName?: string;
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
  inlineFilterClassName,
  dropdownFilterClassName,
}: FundraiserStatusFilterProps) {
  const t = useTranslations('Dashboard.statusFilter');
  const locale = useLocale();

  return (
    <>
      <ToggleGroup
        type='single'
        value={value}
        onValueChange={(v: FundraiserListStatusFilter) => {
          if (v) onChange(v);
        }}
        aria-label={t('groupLabel')}
        className={cn(
          'w-full shrink-0 justify-between overflow-x-auto md:w-fit md:justify-start md:overflow-x-visible',
          inlineFilterClassName
        )}
      >
        {STATUS_FILTER_OPTIONS.map(option => (
          <ToggleGroupItem key={option} value={option} className='px-4'>
            <span>{t(option)}</span>
            <span
              className={cn(
                'inline-flex min-w-4 items-center justify-center rounded-full px-1 text-xs font-medium',
                value === option
                  ? 'bg-muted text-foreground'
                  : 'bg-background/70 text-muted-foreground'
              )}
            >
              {formatCompactNumber(statusCounts[option], locale)}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            aria-label={t('groupLabel')}
            className={cn(
              'h-9 min-w-0 w-full justify-between border-border/60 bg-background px-2',
              dropdownFilterClassName
            )}
          >
            <span className='inline-flex min-w-0 items-center gap-1.5 truncate'>
              <ListFilter
                className='h-4 w-4 shrink-0 m-1 text-muted-foreground'
                aria-hidden='true'
              />
              <span className='truncate font-medium text-foreground'>
                {t(value)}
              </span>
              <span className='inline-flex min-w-4 items-center justify-center rounded-full bg-muted px-1 text-xs font-medium text-muted-foreground'>
                {formatCompactNumber(statusCounts[value], locale)}
              </span>
            </span>
            <ChevronDown className='ml-2 h-4 w-4 shrink-0' aria-hidden='true' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          className='w-(--radix-dropdown-menu-trigger-width) rounded-xl border-border/60 shadow-lg'
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
                  {formatCompactNumber(statusCounts[option], locale)}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

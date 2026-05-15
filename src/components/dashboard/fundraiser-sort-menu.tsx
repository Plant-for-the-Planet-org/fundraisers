'use client';

import type { FundraiserListSort } from '@/lib/utils/fundraiser-list';

import { useTranslations } from 'next-intl';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/index';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FundraiserSortMenuProps {
  value: FundraiserListSort;
  onChange: (next: FundraiserListSort) => void;
  className?: string;
}

const SORT_OPTIONS: FundraiserListSort[] = [
  'newest',
  'oldest',
  'most-raised',
  'ending-soonest',
  'name-asc',
];

export function FundraiserSortMenu({
  value,
  onChange,
  className,
}: FundraiserSortMenuProps) {
  const t = useTranslations('Dashboard.sort');

  const selectedSortLabel = t(`options.${value}`);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className={cn(
            'h-9 w-full justify-between border-border/60 bg-background px-4 has-[>svg]:px-4 md:w-52',
            className
          )}
        >
          <span className='inline-flex min-w-0 items-center gap-1 truncate'>
            <span className='text-muted-foreground'>{t('triggerLabel')}</span>
            <span className='truncate font-medium text-foreground'>
              {selectedSortLabel}
            </span>
          </span>
          <ChevronDown className='ml-2 h-4 w-4 shrink-0' aria-hidden='true' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-52 rounded-xl border-border/60 shadow-lg'
      >
        {SORT_OPTIONS.map(option => {
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
              <span>{t(`options.${option}`)}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

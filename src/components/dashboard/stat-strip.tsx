'use client';

import type { ReactNode } from 'react';

import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Columns = 3 | 4;

// Dividers only run between cells that sit side by side; stacked cells on small screens get a line between rows instead.
const LAYOUT: Record<Columns, string> = {
  3: 'grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0',
  4: 'grid-cols-2 lg:grid-cols-4 lg:divide-x',
};

/** A row of key numbers in one card, shared by the dashboard Overview and each fundraiser's Overview. */
export function StatStrip({
  columns,
  children,
}: {
  columns: Columns;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn(
        'grid gap-0 divide-border/60 border-border/60 py-0 shadow-xs',
        LAYOUT[columns]
      )}
    >
      {children}
    </Card>
  );
}

export function StatCell({
  label,
  value,
  delta,
  helper,
}: {
  label: string;
  value: ReactNode;
  /** A short change indicator shown on the same line as the value. */
  delta?: ReactNode;
  helper?: ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1 px-5 py-4'>
      <p className='text-xs font-medium text-muted-foreground'>{label}</p>
      <p className='flex items-baseline gap-2'>
        <span className='text-2xl font-semibold tracking-tight text-foreground tabular-nums'>
          {value}
        </span>
        {delta}
      </p>
      {helper ? (
        <p className='text-xs text-muted-foreground'>{helper}</p>
      ) : null}
    </div>
  );
}

export function StatStripSkeleton({
  columns,
  label,
}: {
  columns: Columns;
  /** What screen readers hear while the numbers load. */
  label: string;
}) {
  return (
    <div role='status' aria-busy='true' aria-label={label}>
      <StatStrip columns={columns}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className='flex flex-col gap-2 px-5 py-4'>
            <Skeleton className='h-3 w-20' />
            <Skeleton className='h-7 w-24' />
          </div>
        ))}
      </StatStrip>
    </div>
  );
}

/**
 * A signed change like "+54%" or "−20%" against an earlier period, coloured by direction.
 * `context` ("vs last week") is the tooltip and what screen readers hear. Renders nothing when there is no earlier figure to compare with.
 */
export function StatDelta({
  current,
  previous,
  context,
}: {
  current: number;
  previous: number;
  context: string;
}) {
  const locale = useLocale();
  if (previous === 0) return null;
  const change = (current - previous) / previous;
  const rounded = Math.round(change * 100);

  return (
    <span
      title={context}
      className={cn(
        'text-xs font-medium tabular-nums',
        rounded > 0 && 'text-success',
        rounded < 0 && 'text-destructive',
        rounded === 0 && 'text-muted-foreground'
      )}
    >
      {new Intl.NumberFormat(locale, {
        style: 'percent',
        signDisplay: 'exceptZero',
      }).format(rounded / 100)}
      <span className='sr-only'> {context}</span>
    </span>
  );
}

'use client';

import type { FunnelStep } from '@/lib/analytics/insights-report';

import { useLocale, useTranslations } from 'next-intl';
import { formatCompactNumber } from '@/lib/utils';
import { cn } from '@/lib/utils/cn';

// Print is drawn in fixed neutrals and the report's own accent and fonts, because paper has no theme and grey text must stay dark enough to read.
const STYLES = {
  screen: {
    grid: 'gap-2',
    label: 'text-xs font-medium text-muted-foreground',
    track: 'bg-muted',
    fill: 'bg-accent-color',
    count: 'text-lg font-semibold text-foreground',
    percent: 'text-xs text-muted-foreground',
  },
  print: {
    grid: 'gap-3',
    label: 'text-[13px] font-bold text-neutral-700',
    track: 'bg-neutral-200',
    fill: 'bg-[var(--report-accent)]',
    count: 'font-[family-name:var(--report-title-font)] text-xl font-bold',
    percent: 'text-[13px] font-bold text-neutral-600',
  },
} as const;

/**
 * The donation journey as one compact row: visitors, then each step, each with a bar that fills to its share of visitors, its count and its percent.
 * Shared by the Insights tab and the PDF report, so the two always read the same.
 */
export function InsightsFunnel({
  steps,
  variant,
}: {
  steps: FunnelStep[];
  variant: keyof typeof STYLES;
}) {
  const t = useTranslations('Dashboard.fundraiser.insights.journey');
  const locale = useLocale();
  const styles = STYLES[variant];
  const percent = new Intl.NumberFormat(locale, { style: 'percent' });
  // A real count that rounds to 0% would read as none, so it shows as under 1%.
  const percentLabel = (step: FunnelStep) =>
    step.value > 0 && step.percent === 0
      ? `<${percent.format(0.01)}`
      : percent.format(step.percent / 100);

  return (
    <dl className={cn('grid grid-cols-4', styles.grid)}>
      {steps.map(step => (
        <div key={step.key} className='flex min-w-0 flex-col gap-1.5'>
          <dt className={cn('truncate', styles.label)}>{t(step.key)}</dt>
          <dd className='m-0 flex flex-col gap-1.5'>
            <div
              className={cn(
                'relative h-7 overflow-hidden rounded-md',
                styles.track
              )}
              aria-hidden='true'
            >
              <div
                className={cn('absolute inset-x-0 bottom-0', styles.fill)}
                style={{
                  height:
                    step.value === 0 ? 0 : `${Math.max(3, step.percent)}%`,
                }}
              />
            </div>
            <span className='flex items-baseline gap-1.5'>
              <span className={cn('tabular-nums', styles.count)}>
                {formatCompactNumber(step.value, locale)}
              </span>
              <span className={styles.percent}>{percentLabel(step)}</span>
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

'use client';

import type { InsightsSeries } from '@/lib/types/fundraiser-insights';

import { useLocale, useTranslations } from 'next-intl';
import { formatBucket } from '@/lib/analytics/insights-buckets';
import {
  axisLabelIndexes,
  MAX_LABELLED_BARS,
  valueLabelIndexes,
} from '@/lib/analytics/insights-report';
import { formatCompactNumber } from '@/lib/utils';

const CHART_HEIGHT = 124;
// Leaves room above the tallest bar for its printed value.
const MAX_BAR = 84;

/** Visitors per bucket for print: values are printed on the bars because paper has no tooltips, and long series get three axis labels instead of one per bar. */
export function ReportChart({ data }: { data: InsightsSeries }) {
  const t = useTranslations('Dashboard.fundraiser.insights');
  const tReport = useTranslations('Dashboard.fundraiser.insights.report');
  const locale = useLocale();

  const { buckets, unit } = data;
  const max = Math.max(1, ...buckets.map(bucket => bucket.visitors));
  const valueIndexes = new Set(valueLabelIndexes(buckets));
  const axisIndexes = axisLabelIndexes(buckets.length);
  const labelEveryBar = buckets.length <= MAX_LABELLED_BARS;
  const label = (index: number) => formatBucket(buckets[index]!, unit, locale);

  return (
    <div className='flex flex-col gap-3'>
      <h2 className='font-[family-name:var(--report-title-font)] text-[17px] leading-6 font-semibold'>
        {tReport(`chartTitle.${unit}`)}
      </h2>

      {data.visitors === 0 ? (
        <p className='py-6 text-center text-sm text-neutral-600'>
          {t('empty')}
        </p>
      ) : (
        <div className='flex flex-col gap-2'>
          <div
            className='flex items-end gap-[3px] border-b border-neutral-900 pt-1'
            style={{ height: CHART_HEIGHT }}
            role='img'
            aria-label={t('chartLabel')}
          >
            {buckets.map((bucket, index) => (
              <div
                key={bucket.key}
                className='flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1'
              >
                {valueIndexes.has(index) && (
                  <span className='text-[13px] leading-none font-bold tabular-nums'>
                    {formatCompactNumber(bucket.visitors, locale)}
                  </span>
                )}
                <div
                  className='w-full max-w-14 rounded-t bg-[var(--report-accent)]'
                  style={{
                    height:
                      bucket.visitors === 0
                        ? 0
                        : Math.max(2, (bucket.visitors / max) * MAX_BAR),
                  }}
                />
              </div>
            ))}
          </div>

          {labelEveryBar ? (
            <div className='flex gap-[3px]'>
              {buckets.map((bucket, index) => (
                <span
                  key={bucket.key}
                  className='min-w-0 flex-1 text-center text-xs font-semibold whitespace-nowrap text-neutral-600'
                >
                  {label(index)}
                </span>
              ))}
            </div>
          ) : (
            <div className='flex justify-between text-xs font-semibold whitespace-nowrap text-neutral-600'>
              {axisIndexes.map(index => (
                <span key={index}>{label(index)}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

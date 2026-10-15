'use client';

import type { HighlightImpactUnit } from '@/lib/api/alltime-stats';
import type { Fundraiser } from '@/lib/types/fundraiser';

import { useTranslations } from 'next-intl';
import { formatCompactNumber } from '@/lib/utils';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import {
  convertTotalRaisedToSingleCurrency,
  isLeaderboardShown,
} from '@/lib/utils/fundraiser';
import { useAlltimeStats } from '../hooks/use-alltime-stats';
import { GlassPanel } from './glass-panel';

interface StageCounterProps {
  fundraiser: Fundraiser;
  showImpact: boolean;
  showProgressBar: boolean;
  locale: string;
  className?: string;
}

// Live counter: polls alltime-stats and hands the numbers to the view below.
export function StageCounter({
  fundraiser,
  showImpact,
  showProgressBar,
  locale,
  className,
}: StageCounterProps) {
  const { data } = useAlltimeStats(fundraiser.slug ?? fundraiser.id);

  // Once the stats have loaded they decide what shows. The fundraiser loaded with the page only fills the first frame, and goes stale on a screen left running.
  const currency = data?.stats.goal?.currency ?? fundraiser.currency;
  const raised = convertTotalRaisedToSingleCurrency(
    (data ? data.stats.raised : fundraiser.totalRaised) ?? {},
    currency
  );
  const goal = data ? data.stats.goal?.amount : fundraiser.goalAmount;
  // null when the host turned the leaderboard off. Then Stage shows no donor count.
  const donationCount = data
    ? data.stats.donationCount
    : isLeaderboardShown(fundraiser)
      ? fundraiser.donationCount
      : null;
  const trees = data?.stats.impact.trees ?? 0;
  const restoredM2 = data?.stats.impact.restoredM2 ?? 0;
  const daysLeft = data?.stats.daysLeft;

  // The host hid the goal section while this screen was open. The stats now carry no money, so the counter steps aside; a reload shows the Stage notice.
  if (data && data.stats.raised === null) return null;

  return (
    <StageCounterView
      raised={raised}
      currency={currency}
      goal={goal}
      donationCount={donationCount}
      trees={trees}
      restoredM2={restoredM2}
      daysLeft={daysLeft}
      showDaysLeft={data?.settings.show_days_left ?? false}
      showImpactStat={showImpact && (data?.settings.show_impact ?? false)}
      showProgressBar={showProgressBar}
      highlight={data?.settings.highlight_impact ?? 'funding'}
      locale={locale}
      className={className}
    />
  );
}

export interface StageCounterViewProps {
  raised: number;
  currency: string | null;
  goal: number | undefined;
  /** null hides the donor count, as when the host turned the leaderboard off. */
  donationCount: number | null;
  trees: number;
  restoredM2: number;
  daysLeft?: number;
  showDaysLeft: boolean;
  showImpactStat: boolean;
  showProgressBar: boolean;
  highlight: HighlightImpactUnit;
  locale: string;
  className?: string;
}

// Pure counter panel. The live stage and the About page demo both render it; only the data source differs.
export function StageCounterView({
  raised,
  currency,
  goal,
  donationCount,
  trees,
  restoredM2,
  daysLeft,
  showDaysLeft,
  showImpactStat,
  showProgressBar,
  highlight,
  locale,
  className,
}: StageCounterViewProps) {
  const showTrees = showImpactStat && trees > 0;

  const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const t = useTranslations('Stage');

  function formatImpact(unit: HighlightImpactUnit): {
    value: number;
    label: string;
    display: string;
  } {
    switch (unit) {
      case 'trees':
        return {
          value: trees,
          label: t('treesPlanted'),
          display: trees.toLocaleString(locale),
        };
      case 'restoredM2':
        return {
          value: restoredM2,
          label: t('areaRestored'),
          display: `${restoredM2.toLocaleString(locale)} m²`,
        };
      case 'funding':
      default:
        return {
          value: raised,
          label: t('raisedSoFar'),
          display: formatCurrencyFromDecimal(raised, currency, locale, {
            compact: true,
          }),
        };
    }
  }

  const heroUnit: HighlightImpactUnit =
    formatImpact(highlight).value > 0 ? highlight : 'funding';
  const hero = formatImpact(heroUnit);
  const heroIsFunding = heroUnit === 'funding';

  function formatDonorCount(n: number): string {
    const formatted = formatCompactNumber(n, locale);
    // Only mark the count as approximate ("1.2 M+") when it is actually
    // abbreviated; full counts below a million are exact, so no "+".
    return n >= 1_000_000 ? `${formatted}+` : formatted;
  }

  return (
    <GlassPanel className={`p-6 ${className ?? ''}`}>
      <div className='text-[11px] font-bold uppercase tracking-[.18em] opacity-60'>
        {hero.label}
      </div>

      <div
        className='mt-0.5 text-[76px] font-bold leading-[1.02] tracking-[-0.03em]'
        style={{
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--accent-color)',
        }}
      >
        {hero.display}
      </div>

      {heroIsFunding && goal !== undefined && (
        <div className='mt-2 flex items-baseline justify-between text-sm opacity-70'>
          <span>
            {t('ofGoal', {
              goal: formatCurrencyFromDecimal(goal, currency, locale, {
                compact: true,
              }),
            })}
          </span>
          <span>{pct}%</span>
        </div>
      )}

      {showProgressBar && heroIsFunding && goal !== undefined && (
        <div
          className='mt-2.5 h-2 overflow-hidden rounded-full'
          style={{ background: 'rgba(11,18,32,.08)' }}
        >
          <div
            className='h-full rounded-full transition-[width] duration-700 overflow-hidden relative'
            style={{
              width: `${pct}%`,
              background: 'var(--accent-color)',
              boxShadow:
                '0 0 12px color-mix(in srgb, var(--accent-color) 50%, transparent)',
            }}
          >
            <div
              className='absolute inset-0 motion-reduce:animate-none!'
              style={{
                animation: 'stage-shimmer 2s linear infinite',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                transform: 'skewX(-20deg)',
                width: '60%',
              }}
            />
          </div>
          <style>{`
            @keyframes stage-shimmer {
              from { transform: skewX(-20deg) translateX(-100%); }
              to   { transform: skewX(-20deg) translateX(300%); }
            }
          `}</style>
        </div>
      )}

      <div
        className='mt-3.5 flex gap-5 border-t pt-3.5'
        style={{ borderColor: 'rgba(11,18,32,.12)' }}
      >
        {donationCount !== null && (
          <div className='flex flex-col gap-0.5'>
            <span
              className='text-[22px] font-bold'
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatDonorCount(donationCount)}
            </span>
            <span className='text-[11px] font-bold uppercase tracking-[.14em] opacity-60'>
              {t('donors')}
            </span>
          </div>
        )}

        {!heroIsFunding ? (
          <div className='flex flex-col gap-0.5'>
            <span
              className='text-[22px] font-bold'
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCurrencyFromDecimal(raised, currency, locale, {
                compact: true,
              })}
            </span>
            <span className='text-[11px] font-bold uppercase tracking-[.14em] opacity-60'>
              {t('raised')}
            </span>
          </div>
        ) : (
          showTrees && (
            <div className='flex flex-col gap-0.5'>
              <span
                className='text-[22px] font-bold'
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {trees.toLocaleString(locale)}
              </span>
              <span className='text-[11px] font-bold uppercase tracking-[.14em] opacity-60'>
                {t('trees')}
              </span>
            </div>
          )
        )}

        {showDaysLeft && daysLeft !== undefined && daysLeft > 0 && (
          <div className='flex flex-col gap-0.5'>
            <span
              className='text-[22px] font-bold'
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {daysLeft}
            </span>
            <span className='text-[11px] font-bold uppercase tracking-[.14em] opacity-60'>
              {t('daysLeft')}
            </span>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

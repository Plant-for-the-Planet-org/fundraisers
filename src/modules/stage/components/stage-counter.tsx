'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { HighlightImpactUnit } from '@/lib/types/alltime-stats';

import { useTranslations } from 'next-intl';
import { useAlltimeStats } from '../hooks/use-alltime-stats';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { getLocalizedAbbreviatedCount } from '@/lib/utils/formatting';
import { GlassPanel } from './glass-panel';

interface StageCounterProps {
  fundraiser: Fundraiser;
  showImpact: boolean;
  showProgressBar: boolean;
  locale: string;
}

export function StageCounter({
  fundraiser,
  showImpact,
  showProgressBar,
  locale,
}: StageCounterProps) {
  const { data } = useAlltimeStats(fundraiser.slug ?? fundraiser.id);

  const raised = data?.stats.raised.total ?? fundraiser.totalRaised;
  const currency = data?.stats.raised.currency ?? fundraiser.currency;
  const goal = data?.stats.goal.amount ?? fundraiser.goalAmount;
  const donationCount = data?.stats.donationCount ?? fundraiser.donationCount;
  const trees = data?.stats.impact.trees ?? 0;
  const restoredM2 = data?.stats.impact.restoredM2 ?? 0;
  const daysLeft = data?.stats.daysLeft;

  const showDaysLeft = data?.settings.show_days_left ?? false;
  const showImpactStat = showImpact && (data?.settings.show_impact ?? false);
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
          display: formatCurrencyFromDecimal(raised, currency, locale),
        };
    }
  }

  const requestedHighlight: HighlightImpactUnit =
    data?.settings.highlight_impact ?? 'funding';
  const heroUnit: HighlightImpactUnit =
    formatImpact(requestedHighlight).value > 0 ? requestedHighlight : 'funding';
  const hero = formatImpact(heroUnit);
  const heroIsFunding = heroUnit === 'funding';

  function formatDonorCount(n: number): string {
    const formatted = getLocalizedAbbreviatedCount(n, locale);
    return n >= 1000 ? `${formatted}+` : formatted;
  }

  return (
    <GlassPanel className='absolute right-12 top-12 z-[18] w-[440px] p-6'>
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

      {heroIsFunding && (
        <div className='mt-2 flex items-baseline justify-between text-sm opacity-70'>
          <span>
            {t('ofGoal', {
              goal: formatCurrencyFromDecimal(goal, currency, locale),
            })}
          </span>
          <span>{pct}%</span>
        </div>
      )}

      {showProgressBar && heroIsFunding && (
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
              className='absolute inset-0'
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

        {!heroIsFunding ? (
          <div className='flex flex-col gap-0.5'>
            <span
              className='text-[22px] font-bold'
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCurrencyFromDecimal(raised, currency, locale)}
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

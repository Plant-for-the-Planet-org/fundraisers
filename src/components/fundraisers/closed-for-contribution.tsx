'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Compass, Share2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';

// Keep off until the backend fixes the alltime-stats unit aggregation (values are ~100x too high for older fundraisers; reported to Jorgo on 2026-09-09). Flip to true once confirmed.
const SHOW_IMPACT_LINE = true;

export interface FundraiserImpact {
  trees: number;
  conservedM2: number;
  restoredM2: number;
  funding: number;
}

interface ClosedForContributionProps {
  title: string;
  /** True once the fundraiser has run its course. Only then is the celebratory copy true. */
  concluded: boolean;
  raisedAmount: number;
  goalAmount: number;
  currency: string | null | undefined;
  donationCount: number;
  projectNames: string[];
  /** Impact units from alltime-stats. Rendered only when SHOW_IMPACT_LINE is on and at least one unit is positive. */
  impact?: FundraiserImpact;
  /** Fundraiser path, e.g. `/raise/my-slug`. Omit for unlisted fundraisers so no share button renders. */
  sharePath?: string;
}

export function ClosedForContribution({
  title,
  concluded,
  raisedAmount,
  goalAmount,
  currency,
  donationCount,
  projectNames,
  impact,
  sharePath,
}: ClosedForContributionProps) {
  const t = useTranslations('Fundraisers.closedForContribution');
  const locale = useLocale();

  // A paused or cancelled fundraiser can sit above its goal without having ended, so the badge and the goal-reached heading are held back until it has actually concluded.
  const goalReached = concluded && goalAmount > 0 && raisedAmount >= goalAmount;
  const fundedPercent = goalReached
    ? Math.round((raisedAmount / goalAmount) * 100)
    : 0;
  const amount = formatCurrencyFromDecimal(raisedAmount, currency, locale);

  const heading = !concluded
    ? t('titleNotAvailable')
    : goalReached && donationCount > 0
      ? t('titleGoalReached', { count: donationCount })
      : t('title');

  const raisedSentence =
    !concluded || raisedAmount <= 0
      ? null
      : projectNames.length === 1
        ? t('raisedForProject', { amount, project: projectNames[0] })
        : t('raised', { amount });

  // One clause per unit with a value. Areas read in hectares once they reach one, otherwise in m².
  function formatArea(m2: number): string {
    const ha = m2 / 10_000;
    return ha >= 1
      ? t('areaHa', {
          area: ha.toLocaleString(locale, { maximumFractionDigits: 1 }),
        })
      : t('areaM2', { area: m2.toLocaleString(locale) });
  }
  function buildImpactParts(units?: FundraiserImpact): string[] {
    if (!units) return [];
    const parts: string[] = [];
    if (units.trees > 0) parts.push(t('impactTrees', { count: units.trees }));
    if (units.restoredM2 > 0)
      parts.push(t('impactRestored', { area: formatArea(units.restoredM2) }));
    if (units.conservedM2 > 0)
      parts.push(t('impactConserved', { area: formatArea(units.conservedM2) }));
    if (units.funding > 0) parts.push(t('impactFunding'));
    return parts;
  }

  const impactParts =
    SHOW_IMPACT_LINE && concluded ? buildImpactParts(impact) : [];
  const impactSentence =
    raisedAmount > 0 && impactParts.length > 0
      ? t('impactLine', {
          impact: new Intl.ListFormat(locale, {
            style: 'long',
            type: 'conjunction',
          }).format(impactParts),
        })
      : null;

  const body = [
    raisedSentence,
    impactSentence,
    concluded ? t('closedNote') : t('notAvailableNote'),
  ]
    .filter(Boolean)
    .join(' ');

  const handleShare = async () => {
    if (!sharePath) return;
    // Built from the canonical path, so the sharer's own landing params never travel with the link. Tokens are listed in docs/naming.md.
    const url = new URL(sharePath, window.location.origin);
    url.searchParams.set('utm_source', 'fundraiser');
    url.searchParams.set('utm_medium', 'closed_banner');
    const shareUrl = url.toString();
    const text = t('shareText', { title, amount });

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, text, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('shareCopied'));
    } catch (error) {
      // The user closing the native share sheet is not a failure worth a toast.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error(t('shareFailed'));
    }
  };

  return (
    <section
      aria-labelledby='closed-for-contribution-title'
      className='closed-for-contribution snake-border flex flex-col gap-3 rounded-2xl border-2 border-white bg-mode-base/40 p-4 dark:border-none dark:bg-white/10'
    >
      {goalReached && (
        <span className='inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-color/20 px-2.5 py-1 text-xs font-medium text-foreground'>
          <Trophy className='size-3.5' aria-hidden='true' />
          {t('fundedBadge', { percent: fundedPercent })}
        </span>
      )}

      <div className='flex flex-col gap-1'>
        <h2
          id='closed-for-contribution-title'
          className='text-foreground text-base font-semibold leading-snug'
        >
          {heading}
        </h2>
        {body && <p className='text-muted-foreground text-sm'>{body}</p>}
      </div>

      <div className='flex flex-wrap gap-2'>
        <Button asChild variant='outline' size='sm'>
          <Link href='/explore'>
            <Compass aria-hidden='true' />
            {t('exploreCta')}
          </Link>
        </Button>
        {concluded && sharePath && (
          <Button variant='ghost' size='sm' onClick={handleShare}>
            <Share2 aria-hidden='true' />
            {t('shareCta')}
          </Button>
        )}
      </div>
    </section>
  );
}

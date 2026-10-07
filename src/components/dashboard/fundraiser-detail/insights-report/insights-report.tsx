'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';
import type { InsightsRange } from '@/lib/types/fundraiser-insights';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  publicHostsLine,
  readableInk,
  reportLink,
} from '@/lib/analytics/insights-report';
import { getAccentColor } from '@/lib/theme/accent-utils';
import { buildTheme } from '@/lib/theme/build-theme';
import { getFontStack } from '@/lib/theme/font-utils';
import { convertTotalRaisedToSingleCurrency } from '@/lib/utils/fundraiser';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ArrowLeftIcon } from '@/components/ui/ui-icons';
import { useFundraiserInsights } from '../use-fundraiser-insights';
import { useLeaderboardSummary } from '../use-leaderboard-summary';
import { ReportSheet } from './report-sheet';

// A4, no margin: the sheet draws its own. Everything else on the page is hidden when printing, so banners and toasts from the app shell never end up on paper.
// The logo animates on screen, so it is frozen on the heart here; a print could otherwise catch it mid-flip.
const PRINT_CSS = `
@page { size: A4; margin: 0; }
@media print {
  body * { visibility: hidden; }
  [data-report-sheet], [data-report-sheet] * { visibility: visible; }
  [data-report-sheet] { position: absolute; top: 0; left: 0; }
  html, body { background: #fff; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
[data-report-sheet] .sp-heart-face { animation: none; transform: translate(397px, 14px) scaleX(1); }
[data-report-sheet] .sp-planet-face { animation: none; transform: translate(397px, 14px) scaleX(0); }
`;

/** The print page for one fundraiser: a toolbar on screen, and the A4 report that is printed. */
export function InsightsReport({
  fundraiser,
  range,
}: {
  fundraiser: Fundraiser;
  range: InsightsRange;
}) {
  const t = useTranslations('Dashboard.fundraiser.insights');
  const tReport = useTranslations('Dashboard.fundraiser.insights.report');
  const [attempt, setAttempt] = useState(0);
  const insights = useFundraiserInsights(fundraiser.slug, range, attempt);
  const leaderboard = useLeaderboardSummary(fundraiser.id, 1);
  // This page only mounts after the fundraiser has loaded in the browser, so `window` exists here.
  const [origin] = useState(() => window.location.origin);
  // Read once: it stamps the report with the moment it was made.
  const [generatedAt] = useState(() => Date.now());

  // The report wears the fundraiser's own look: its accent and its fonts.
  const theme = buildTheme(fundraiser.settings?.theme);
  const accent = getAccentColor(theme.accent);
  const backHref = `/dashboard/fundraisers/${encodeURIComponent(fundraiser.slug)}/insights`;

  const ready = insights.status === 'ready' && !leaderboard.isLoading;

  // The browser suggests the tab title as the file name when saving as PDF.
  useEffect(() => {
    const previous = document.title;
    document.title = `${fundraiser.title} - ${tReport('toolbarTitle')}`;
    return () => {
      document.title = previous;
    };
  }, [fundraiser.title, tReport]);

  return (
    <div className='min-h-screen bg-neutral-100 py-6 print:min-h-0 print:bg-white print:py-0'>
      <style>{PRINT_CSS}</style>

      <div className='mx-auto mb-4 flex w-[210mm] max-w-full items-center justify-between gap-3 px-2 print:hidden'>
        <Button asChild variant='ghost' size='sm'>
          <Link href={backHref}>
            <ArrowLeftIcon />
            {tReport('back')}
          </Link>
        </Button>
        <div className='flex items-center gap-3'>
          <p className='hidden text-xs text-neutral-600 sm:block'>
            {tReport('toolbarHint')}
          </p>
          <Button size='sm' disabled={!ready} onClick={() => window.print()}>
            {tReport('print')}
          </Button>
        </div>
      </div>

      {insights.status === 'error' ? (
        <div className='mx-auto flex w-[210mm] max-w-full flex-col items-center gap-3 rounded-lg bg-white py-16 text-center shadow-sm print:hidden'>
          <p className='text-sm text-neutral-600'>{t('loadError')}</p>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setAttempt(count => count + 1)}
          >
            {t('retry')}
          </Button>
        </div>
      ) : !ready ? (
        <Loader text={tReport('loading')} />
      ) : (
        <div className='overflow-x-auto'>
          <ReportSheet
            title={fundraiser.title}
            hosts={publicHostsLine(fundraiser.hosts)}
            data={insights.data}
            raised={convertTotalRaisedToSingleCurrency(
              fundraiser.totalRaised,
              fundraiser.currency
            )}
            goal={fundraiser.goalAmount}
            currency={fundraiser.currency}
            donations={fundraiser.donationCount}
            donors={leaderboard.data?.donorCount ?? null}
            accent={accent}
            ink={readableInk(accent)}
            bodyFont={getFontStack(theme.bodyFont)}
            titleFont={getFontStack(theme.titleFont)}
            generatedAt={generatedAt}
            link={reportLink(origin, fundraiser.slug)}
          />
        </div>
      )}
    </div>
  );
}

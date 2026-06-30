'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useFormatter, useTranslations } from 'next-intl';
import { getHostNames } from '@/lib/utils/fundraiser-list';

// Compact surfaces (dashboard rows, explore cards) name at most this many hosts
// before collapsing the rest into "and N others". The public hosts strip uses a
// higher cap because it has more room.
const MAX_CARD_NAMED = 2;

/**
 * Builds the "by {names}" line for a fundraiser card, e.g. "by Alice",
 * "by Alice and Bob", or "by Alice, Bob and 3 others". Returns null when no
 * host has a name, so the caller can render its own empty fallback.
 *
 * Reuses the same `hostsStripNames` + `format.list` pattern as the public hosts
 * strip so list formatting stays locale-correct and consistent across surfaces.
 */
export function useHostDisplay(fundraiser: Fundraiser): string | null {
  const t = useTranslations('Fundraisers');
  const format = useFormatter();

  const names = getHostNames(fundraiser);
  if (names.length === 0) return null;

  const shown = names.slice(0, MAX_CARD_NAMED);
  const remaining = names.length - shown.length;

  const namesText = t('hostsStripNames', {
    names: format.list(shown, {
      type: remaining > 0 ? 'unit' : 'conjunction',
    }),
    remaining,
  });

  return t('hostedBy', { hostName: namesText });
}

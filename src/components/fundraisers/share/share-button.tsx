'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Share2 } from 'lucide-react';
import { useWebShare } from '@/lib/hooks/use-web-share';
import { buildFundraiserShareData } from '@/lib/share/build-share-data';
import { formatCurrencyFromDecimal } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';
import { ShareMenuDialog } from './share-menu-dialog';

interface ShareButtonProps {
  fundraiser: Fundraiser;
}

/**
 * Top-level share action. Native-first: tries the OS share sheet, and only
 * opens the in-app fallback menu when native share is unavailable or fails.
 */
export function ShareButton({ fundraiser }: ShareButtonProps) {
  const t = useTranslations('Fundraisers.share');
  const locale = useLocale();
  const { share } = useWebShare();
  const [menuOpen, setMenuOpen] = useState(false);

  const buildData = () => {
    const goalText =
      fundraiser.goalAmount > 0
        ? t('goalText', {
            goal: formatCurrencyFromDecimal(
              fundraiser.goalAmount,
              fundraiser.currency,
              locale
            ),
          })
        : undefined;
    // Share message body: title on line 1, goal on line 2; the target appends
    // the URL on line 3. Independent of the OG card text (SHARE_TEXT_SOURCE).
    const text = [fundraiser.title, goalText].filter(Boolean).join('\n');

    return buildFundraiserShareData(fundraiser, window.location.origin, text);
  };

  const handleShare = async () => {
    const result = await share(buildData());
    if (result === 'unsupported' || result === 'error') {
      setMenuOpen(true);
    }
  };

  return (
    <>
      <Button
        variant='outline'
        onClick={handleShare}
        className='w-max border-border bg-white hover:bg-gray-50'
      >
        <Share2 aria-hidden='true' />
        {t('label')}
      </Button>
      {menuOpen && (
        <ShareMenuDialog
          data={buildData()}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        />
      )}
    </>
  );
}

'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useOrigin } from '@/components/share/use-origin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getStageUrl, openStageWindow } from '@/modules/stage';

/** The Stage Mode link, to copy or open. Stage is for big screens at events, so it has its own tab and its own link rather than a studio card. */
export function StageLinkCard({ fundraiser }: { fundraiser: Fundraiser }) {
  const t = useTranslations('Dashboard.fundraiser.stageLink');
  const origin = useOrigin();
  const enabled = fundraiser.settings?.modules?.stage?.enabled === true;
  const url = `${origin ?? ''}${getStageUrl(fundraiser)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyError'));
    }
  };

  return (
    <Card className='gap-3 border-border/60 px-6 py-5 shadow-xs'>
      <div>
        <h2 className='text-lg font-semibold text-foreground'>{t('title')}</h2>
        <p className='mt-0.5 text-sm text-muted-foreground'>
          {enabled ? t('hint') : t('off')}
        </p>
      </div>
      {enabled ? (
        <div className='flex min-w-0 flex-wrap gap-2 sm:flex-nowrap'>
          <Input
            readOnly
            value={url}
            aria-label={t('label')}
            onFocus={event => event.currentTarget.select()}
            className='min-w-0 flex-1 text-xs text-muted-foreground'
          />
          <Button onClick={() => void copy()}>{t('copy')}</Button>
          <Button variant='outline' onClick={() => openStageWindow(fundraiser)}>
            {t('open')}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

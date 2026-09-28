'use client';

import type { Fundraiser } from '@/lib/types/fundraiser';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getFundraiserModuleStates } from '@/lib/utils/fundraiser-checklist';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function FundraiserModulesCard({
  fundraiser,
  canEdit,
}: {
  fundraiser: Fundraiser;
  /** Turning features on needs edit rights; view-only co-hosts only see what is on. */
  canEdit: boolean;
}) {
  const t = useTranslations('Dashboard.fundraiser.modules');
  const modules = getFundraiserModuleStates(fundraiser);
  // Module settings live in the editor, so every call to action goes there.
  const editHref = `/dashboard/fundraisers/edit/${fundraiser.slug}`;

  return (
    <Card className='gap-4 border-border/60 px-6 py-5 shadow-xs'>
      <h2 className='text-lg font-semibold text-foreground'>{t('title')}</h2>

      <ul className='m-0 flex list-none flex-col divide-y divide-border p-0'>
        {modules.map(module => (
          <li key={module.id} className='flex items-start gap-3 py-3'>
            <div className='min-w-0 flex-1'>
              <p className='flex items-center gap-2 text-sm font-medium text-foreground'>
                {t(`items.${module.id}.title`)}
                {module.enabled && (
                  <span className='rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success'>
                    {t('on')}
                  </span>
                )}
              </p>
              <p className='mt-0.5 text-sm text-muted-foreground'>
                {t(`items.${module.id}.hint`)}
              </p>
            </div>
            {canEdit && (
              <Button
                asChild
                variant={module.enabled ? 'ghost' : 'outline'}
                size='sm'
              >
                <Link href={editHref}>
                  {module.enabled ? t('manage') : t('turnOn')}
                </Link>
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

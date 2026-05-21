'use client';

import { useTranslations } from 'next-intl';
import { CopyLinkButton } from '@/components/fundraisers/copy-link-button';

interface ShareSectionProps {
  fundraiserSlug: string;
}

export function ShareSection({ fundraiserSlug }: ShareSectionProps) {
  const t = useTranslations('Donate.thankYou.share');
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/raise/${fundraiserSlug}`
      : undefined;

  return (
    <div className='rounded-xl border border-border bg-card px-6 py-6'>
      <h3 className='text-base font-semibold text-foreground'>{t('title')}</h3>
      <p className='mt-1 text-sm text-muted-foreground'>{t('description')}</p>
      <CopyLinkButton url={shareUrl} />
    </div>
  );
}

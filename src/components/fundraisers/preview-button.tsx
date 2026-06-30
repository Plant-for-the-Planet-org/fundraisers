'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function PreviewButton() {
  const t = useTranslations('Fundraisers.form');
  return (
    <Button variant='ghost' type='button'>
      {t('previewButton')}
    </Button>
  );
}

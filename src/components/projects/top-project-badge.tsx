import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

/**
 * Marks a project the platform features as a Top Project. Rendered only when
 * the API reports `isTopProject`.
 */
export function TopProjectBadge() {
  const t = useTranslations('Projects.hero');

  return (
    <span className='inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-heading'>
      <Sparkles className='h-3.5 w-3.5 text-primary' aria-hidden='true' />
      {t.rich('topProject', {
        highlight: chunks => (
          <strong className='font-semibold'>{chunks}</strong>
        ),
      })}
    </span>
  );
}

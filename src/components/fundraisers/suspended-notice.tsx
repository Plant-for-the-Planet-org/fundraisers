import { useTranslations } from 'next-intl';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/** Tells a host that staff suspended the fundraiser. Only hosts get `isSuspended`, so callers render this when it is true. */
export function SuspendedNotice({ className }: { className?: string }) {
  const t = useTranslations('Fundraisers');

  return (
    <Alert variant='destructive' className={className}>
      <CircleAlert aria-hidden='true' />
      <AlertDescription>
        <p>
          {t.rich('suspendedNotice', {
            link: chunks => (
              <a
                href='mailto:support@plant-for-the-planet.org'
                className='underline'
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </AlertDescription>
    </Alert>
  );
}

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';

interface ClosedForContributionProps {
  message?: string;
}

export function ClosedForContribution({ message }: ClosedForContributionProps) {
  const t = useTranslations('Fundraisers.closedForContribution');

  return (
    <Card className='closed-for-contribution bg-mode-reverse/5 shadow-none border-none py-0 gap-0 rounded-md'>
      <CardContent className='p-3 flex flex-col gap-1'>
        <div className='text-foreground text-sm font-semibold'>
          {t('title')}
        </div>
        <div className='text-muted-foreground text-sm'>
          {message ?? t('defaultMessage')}
        </div>
      </CardContent>
    </Card>
  );
}

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';

interface ClosedForContributionProps {
  message?: string;
}

export function ClosedForContribution({ message }: ClosedForContributionProps) {
  const t = useTranslations('Fundraisers.closedForContribution');

  return (
    <Card className='closed-for-contribution border border-mode-reverse/20 bg-mode-reverse/10 shadow py-0 gap-0 rounded-2xl'>
      <CardContent className='p-4 rounded-bl-2xl rounded-br-2xl flex flex-col gap-1'>
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

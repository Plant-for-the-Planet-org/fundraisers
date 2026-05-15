import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';

interface SummaryStatCardProps {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
}

export function SummaryStatCard({
  label,
  value,
  helper,
}: SummaryStatCardProps) {
  return (
    <Card className='gap-3 border-border/60 px-6 py-5 shadow-xs'>
      <p className='text-xs font-medium text-muted-foreground uppercase'>
        {label}
      </p>
      <p className='text-4xl font-semibold tracking-tight text-foreground tabular-nums'>
        {value}
      </p>
      {helper ? (
        <p className='text-sm font-medium text-muted-foreground'>{helper}</p>
      ) : null}
    </Card>
  );
}

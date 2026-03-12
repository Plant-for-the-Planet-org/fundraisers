import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CardBaseProps {
  title: string;
  description?: string;
  value: ReactNode;
  helper?: ReactNode;
}

export function CardBase({ title, description, value, helper }: CardBaseProps) {
  return (
    <Card className='border-none hover:shadow-md transition-shadow duration-300'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <p className='text-2xl font-bold'>{value}</p>
        {helper ? (
          <p className='text-xs text-muted-foreground mt-1'>{helper}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

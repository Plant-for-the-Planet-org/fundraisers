import { cn } from '@/lib/utils';

interface TitleDisplayProps {
  value: string;
  className?: string;
}

export default function TitleDisplay({ value, className }: TitleDisplayProps) {
  if (!value) {
    return null;
  }

  return (
    <h1
      className={cn('text-4xl font-bold break-all', className)}
      style={{ fontFamily: 'var(--theme-title-font)' }}
    >
      {value}
    </h1>
  );
}

import { EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionOffNoticeProps {
  title: string;
  description: string;
  className?: string;
}

/** Editor placeholder for a section the host has switched off. */
export function SectionOffNotice({
  title,
  description,
  className,
}: SectionOffNoticeProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-dashed border-border bg-background/60 px-4 py-3',
        className
      )}
    >
      <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'>
        <EyeOff className='size-4' aria-hidden />
      </div>
      <div className='flex flex-col'>
        <p className='text-sm font-medium text-foreground'>{title}</p>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
    </div>
  );
}

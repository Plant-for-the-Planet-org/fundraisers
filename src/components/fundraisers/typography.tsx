import { cn } from '@/lib/utils/cn';

type BaseTypographyProps = {
  content: string;
  className?: string;
};

type SectionHeaderBaseProps = BaseTypographyProps & {
  containerClassName?: string;
  actionSlot?: React.ReactNode;
  showDivider?: boolean;
};

export function Title({ content, className }: BaseTypographyProps) {
  return (
    <h2
      className={cn(
        'text-zinc-800 dark:text-gray-100 text-sm font-semibold leading-tight',
        className
      )}
    >
      {content}
    </h2>
  );
}

export function ContentSectionTitle({
  content,
  className,
}: BaseTypographyProps) {
  return (
    <>
      <h1
        className={cn(
          'text-4xl font-bold cursor-text hover:opacity-80 transition-opacity',
          className
        )}
        style={{ fontFamily: 'var(--theme-title-font)' }}
      >
        {content}
      </h1>
    </>
  );
}

export function Header1({ content, className }: BaseTypographyProps) {
  return (
    <h2
      className={cn(
        'text-zinc-800 dark:text-gray-100 text-sm font-semibold leading-tight',
        className
      )}
    >
      {content}
    </h2>
  );
}
export function Header2({ content, className }: BaseTypographyProps) {
  return (
    <h2
      className={cn(
        'mb-1 text-zinc-800 dark:text-gray-100 text-sm font-semibold leading-tight',
        className
      )}
    >
      {content}
    </h2>
  );
}

export function PreviewSectionHeader1({
  containerClassName,
  content,
  className,
}: SectionHeaderBaseProps) {
  return (
    <div className={cn(containerClassName)}>
      <div className={cn('flex flex-col', className)}>
        <Header1 content={content} />
      </div>
      {/* <div className='h-px bg-gray-200 dark:bg-gray-700' /> */}
    </div>
  );
}

export function PreviewSectionHeader2({
  containerClassName,
  content,
  className,
  actionSlot,
  showDivider = true,
}: SectionHeaderBaseProps) {
  return (
    <div className={cn(containerClassName)}>
      <div className={cn('flex flex-col', className)}>
        <Header2 content={content} />
        {actionSlot}
      </div>
      {showDivider && <div className='h-px bg-gray-200 dark:bg-gray-700' />}
    </div>
  );
}

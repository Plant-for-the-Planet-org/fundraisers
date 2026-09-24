import { cn } from '@/lib/utils/cn';

export function MainPanel({
  children,
  flattenOnMobile = false,
}: {
  children: React.ReactNode;
  /** See `SidebarPanel`. */
  flattenOnMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex-1 flex flex-col gap-6 min-w-0',
        flattenOnMobile && 'max-md:contents'
      )}
    >
      {children}
    </div>
  );
}

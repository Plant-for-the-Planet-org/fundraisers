export function MainPanel({ children }: { children: React.ReactNode }) {
  // data-blur-surface: measured by ThemeShell's blur layer ('panels' mode) so blur hugs this column's real content height.
  return (
    <div data-blur-surface className='flex-1 flex flex-col gap-6 min-w-0'>
      {children}
    </div>
  );
}

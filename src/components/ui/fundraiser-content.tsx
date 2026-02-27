export function FundraiserContent({ children }: { children: React.ReactNode }) {
  return (
    <main className='main-content flex-1'>
      <div className='flex flex-col md:flex-row gap-6 min-w-0'>{children}</div>
    </main>
  );
}

export function FundraiserContentPreviewColumn({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='lg:w-80 shrink-0'>
      <div className='w-full md:w-80 flex flex-col gap-6'>{children}</div>
    </div>
  );
}

export function FundraiserContentMainContentColumn({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className='flex-1 flex flex-col gap-6 min-w-0'>{children}</div>;
}
